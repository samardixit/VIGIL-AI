"""
VIGIL-AI Session Routes
Manage faculty teaching sessions (start/end class, active sessions).
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional
from backend.database.connection import get_db
from backend.database.models import FacultySession, Faculty, AttendanceLog
from backend.core.security import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


class StartSessionRequest(BaseModel):
    subject_name: str
    latitude: float
    longitude: float
    geofence_radius_meters: Optional[int] = 20


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_session(
    request: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Teacher starts a new class session with GPS coordinates."""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can start sessions")

    faculty_db_id = int(current_user["sub"])

    # End any existing active session
    await db.execute(
        update(FacultySession)
        .where(FacultySession.faculty_id == faculty_db_id, FacultySession.is_active == True)
        .values(is_active=False, session_end=datetime.now(timezone.utc))
    )

    session = FacultySession(
        faculty_id=faculty_db_id,
        subject_name=request.subject_name,
        latitude=request.latitude,
        longitude=request.longitude,
        geofence_radius_meters=request.geofence_radius_meters,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "id": session.id,
        "subject_name": session.subject_name,
        "latitude": float(session.latitude),
        "longitude": float(session.longitude),
        "geofence_radius_meters": session.geofence_radius_meters,
        "session_start": session.session_start.isoformat() if session.session_start else None,
        "is_active": session.is_active,
        "message": f"Session '{request.subject_name}' started",
    }


@router.post("/end/{session_id}")
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Teacher ends an active class session."""
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can end sessions")

    result = await db.execute(select(FacultySession).where(FacultySession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session already ended")

    session.is_active = False
    session.session_end = datetime.now(timezone.utc)
    await db.commit()

    att_result = await db.execute(select(AttendanceLog).where(AttendanceLog.session_id == session_id))
    count = len(att_result.scalars().all())

    return {
        "id": session.id,
        "subject_name": session.subject_name,
        "session_end": session.session_end.isoformat(),
        "total_attendance": count,
        "message": f"Session ended. {count} students attended.",
    }


@router.get("/active")
async def get_active_sessions(db: AsyncSession = Depends(get_db)):
    """Get all currently active sessions."""
    result = await db.execute(select(FacultySession).where(FacultySession.is_active == True))
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "faculty_name": f"{s.faculty.first_name} {s.faculty.last_name}" if s.faculty else "Unknown",
            "faculty_id": s.faculty.faculty_id if s.faculty else None,
            "subject_name": s.subject_name,
            "latitude": float(s.latitude),
            "longitude": float(s.longitude),
            "geofence_radius_meters": s.geofence_radius_meters,
            "session_start": s.session_start.isoformat() if s.session_start else None,
        }
        for s in sessions
    ]


@router.get("/active/{faculty_id}")
async def get_faculty_active_session(faculty_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific teacher's active session."""
    result = await db.execute(
        select(FacultySession).join(Faculty)
        .where(Faculty.faculty_id == faculty_id, FacultySession.is_active == True)
    )
    session = result.scalar_one_or_none()
    if not session:
        return {"active": False, "session": None}

    att_result = await db.execute(select(AttendanceLog).where(AttendanceLog.session_id == session.id))
    count = len(att_result.scalars().all())

    return {
        "active": True,
        "session": {
            "id": session.id,
            "subject_name": session.subject_name,
            "latitude": float(session.latitude),
            "longitude": float(session.longitude),
            "geofence_radius_meters": session.geofence_radius_meters,
            "session_start": session.session_start.isoformat() if session.session_start else None,
            "attendance_count": count,
        },
    }
