"""
VIGIL-AI Attendance Routes
GPS verification, biometric scanning, manual override, and attendance queries.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from backend.database.connection import get_db
from backend.database.models import Student, FacultySession, AttendanceLog
from backend.services.geofence import is_within_geofence
from backend.services.face_recognition import verify_face
from backend.websocket.manager import ws_manager
from backend.core.security import get_current_user
from backend.core.config import get_settings

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])
settings = get_settings()


class LocationVerifyRequest(BaseModel):
    session_id: int
    latitude: float
    longitude: float


class ScanRequest(BaseModel):
    session_id: int
    image_base64: str
    latitude: float
    longitude: float


class ManualAttendanceRequest(BaseModel):
    session_id: int
    student_id: str


@router.post("/verify-location")
async def verify_location(request: LocationVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Check if student GPS is within the session geofence."""
    result = await db.execute(select(FacultySession).where(FacultySession.id == request.session_id))
    session = result.scalar_one_or_none()
    if not session or not session.is_active:
        raise HTTPException(status_code=404, detail="No active session found")

    # Check 10-minute window
    if session.session_start:
        window_end = session.session_start.replace(tzinfo=timezone.utc) + timedelta(
            minutes=settings.ATTENDANCE_WINDOW_MINUTES
        )
        now = datetime.now(timezone.utc)
        if now > window_end:
            return {
                "within_geofence": False,
                "window_expired": True,
                "message": "Attendance window has expired (10 minutes)",
            }

    geo_result = is_within_geofence(
        float(session.latitude), float(session.longitude),
        request.latitude, request.longitude,
        session.geofence_radius_meters,
    )
    geo_result["window_expired"] = False
    return geo_result


@router.post("/scan")
async def scan_attendance(request: ScanRequest, db: AsyncSession = Depends(get_db)):
    """Submit webcam frame for face verification and mark attendance."""
    # Validate session
    sess_result = await db.execute(select(FacultySession).where(FacultySession.id == request.session_id))
    session = sess_result.scalar_one_or_none()
    if not session or not session.is_active:
        raise HTTPException(status_code=404, detail="No active session found")

    # Check 10-minute window
    if session.session_start:
        window_end = session.session_start.replace(tzinfo=timezone.utc) + timedelta(
            minutes=settings.ATTENDANCE_WINDOW_MINUTES
        )
        if datetime.now(timezone.utc) > window_end:
            raise HTTPException(status_code=400, detail="Attendance window expired")

    # Verify GPS location
    geo = is_within_geofence(
        float(session.latitude), float(session.longitude),
        request.latitude, request.longitude,
        session.geofence_radius_meters,
    )
    if not geo["within_geofence"]:
        raise HTTPException(status_code=403, detail=f"Outside geofence: {geo['message']}")

    # Run face verification
    face_result = await verify_face(request.image_base64)
    if not face_result["verified"]:
        return {"success": False, "face_result": face_result}

    # Look up student
    matched_sid = face_result["student_id"]
    stu_result = await db.execute(select(Student).where(Student.student_id == matched_sid))
    student = stu_result.scalar_one_or_none()
    if not student:
        return {"success": False, "message": f"Student {matched_sid} not in database"}

    # Check for duplicate attendance
    existing = await db.execute(
        select(AttendanceLog).where(
            AttendanceLog.student_id == student.id,
            AttendanceLog.session_id == session.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"success": False, "message": "Attendance already marked for this session"}

    # Mark attendance
    log = AttendanceLog(
        student_id=student.id,
        session_id=session.id,
        latitude=request.latitude,
        longitude=request.longitude,
        confidence=face_result["confidence"],
        is_live=face_result["is_live"],
        marked_by="biometric",
    )
    db.add(log)
    await db.commit()

    # Broadcast via WebSocket
    await ws_manager.broadcast_attendance_event(
        session_id=session.id,
        student_name=f"{student.first_name} {student.last_name}",
        student_id=student.student_id,
        confidence=face_result["confidence"],
        method="biometric",
    )

    return {
        "success": True,
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "confidence": face_result["confidence"],
        "is_live": face_result["is_live"],
        "message": f"Attendance marked for {student.first_name} {student.last_name}",
    }


@router.post("/manual")
async def manual_attendance(
    request: ManualAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Teacher manually marks attendance for a student (bypasses GPS/biometric)."""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can mark manual attendance")

    # Validate session
    sess_result = await db.execute(select(FacultySession).where(FacultySession.id == request.session_id))
    session = sess_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find student
    stu_result = await db.execute(select(Student).where(Student.student_id == request.student_id))
    student = stu_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{request.student_id}' not found")

    # Check duplicate
    existing = await db.execute(
        select(AttendanceLog).where(
            AttendanceLog.student_id == student.id,
            AttendanceLog.session_id == session.id,
        )
    )
    if existing.scalar_one_or_none():
        return {"success": False, "message": "Attendance already marked"}

    log = AttendanceLog(
        student_id=student.id,
        session_id=session.id,
        confidence=1.0,
        is_live=True,
        marked_by="manual",
        marked_by_faculty_id=int(current_user["sub"]),
    )
    db.add(log)
    await db.commit()

    await ws_manager.broadcast_attendance_event(
        session_id=session.id,
        student_name=f"{student.first_name} {student.last_name}",
        student_id=student.student_id,
        confidence=1.0,
        method="manual",
    )

    return {
        "success": True,
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "message": f"Manual attendance marked for {student.first_name}",
    }


@router.get("/session/{session_id}")
async def get_session_attendance(session_id: int, db: AsyncSession = Depends(get_db)):
    """Get all attendance records for a specific session."""
    records = await db.execute(
        select(AttendanceLog).where(AttendanceLog.session_id == session_id)
        .order_by(AttendanceLog.timestamp.desc())
    )
    logs = records.scalars().all()

    return [
        {
            "id": l.id,
            "student_id": l.student.student_id if l.student else None,
            "student_name": f"{l.student.first_name} {l.student.last_name}" if l.student else "Unknown",
            "confidence": l.confidence,
            "is_live": l.is_live,
            "marked_by": l.marked_by,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]


@router.get("/stats/{student_id}")
async def get_attendance_stats(student_id: str, db: AsyncSession = Depends(get_db)):
    """Get attendance statistics for dashboard."""
    stu_result = await db.execute(select(Student).where(Student.student_id == student_id))
    student = stu_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Total sessions
    total_sessions = await db.execute(select(func.count(FacultySession.id)))
    total = total_sessions.scalar() or 0

    # Attended sessions
    attended = await db.execute(
        select(func.count(AttendanceLog.id)).where(AttendanceLog.student_id == student.id)
    )
    attended_count = attended.scalar() or 0

    percentage = (attended_count / total * 100) if total > 0 else 0

    # Recent records
    recent = await db.execute(
        select(AttendanceLog).where(AttendanceLog.student_id == student.id)
        .order_by(AttendanceLog.timestamp.desc()).limit(10)
    )
    recent_logs = recent.scalars().all()

    return {
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "total_sessions": total,
        "attended": attended_count,
        "percentage": round(percentage, 1),
        "status": "safe" if percentage >= 75 else ("warning" if percentage >= 60 else "danger"),
        "recent": [
            {
                "session_id": r.session_id,
                "subject": r.session.subject_name if r.session else "Unknown",
                "marked_by": r.marked_by,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in recent_logs
        ],
    }
