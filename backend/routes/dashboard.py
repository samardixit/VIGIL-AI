"""
VIGIL-AI Dashboard Routes
Aggregated data endpoints for student and teacher dashboards.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database.connection import get_db
from backend.database.models import Student, Faculty, FacultySession, AttendanceLog

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/student/{student_id}")
async def student_dashboard(student_id: str, db: AsyncSession = Depends(get_db)):
    """Get full dashboard data for a student: heatmap, health bar, recent activity."""
    stu_result = await db.execute(select(Student).where(Student.student_id == student_id))
    student = stu_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Total sessions
    total_result = await db.execute(select(func.count(FacultySession.id)))
    total_sessions = total_result.scalar() or 0

    # Attended
    att_result = await db.execute(
        select(func.count(AttendanceLog.id)).where(AttendanceLog.student_id == student.id)
    )
    attended = att_result.scalar() or 0
    percentage = (attended / total_sessions * 100) if total_sessions > 0 else 0

    # Heatmap data — attendance per day for last 365 days
    records = await db.execute(
        select(AttendanceLog).where(AttendanceLog.student_id == student.id)
        .order_by(AttendanceLog.timestamp.desc())
    )
    all_records = records.scalars().all()

    heatmap = {}
    for r in all_records:
        if r.timestamp:
            day_key = r.timestamp.strftime("%Y-%m-%d")
            heatmap[day_key] = heatmap.get(day_key, 0) + 1

    # Recent activity
    recent = all_records[:10]

    return {
        "student": {
            "id": student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "department": student.department,
            "semester": student.semester,
        },
        "stats": {
            "total_sessions": total_sessions,
            "attended": attended,
            "missed": total_sessions - attended,
            "percentage": round(percentage, 1),
            "status": "safe" if percentage >= 75 else ("warning" if percentage >= 60 else "danger"),
        },
        "heatmap": heatmap,
        "recent_activity": [
            {
                "session_id": r.session_id,
                "subject": r.session.subject_name if r.session else "Unknown",
                "faculty": (
                    f"{r.session.faculty.first_name} {r.session.faculty.last_name}"
                    if r.session and r.session.faculty else "Unknown"
                ),
                "marked_by": r.marked_by,
                "confidence": r.confidence,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in recent
        ],
    }


@router.get("/teacher/{faculty_id}")
async def teacher_dashboard(faculty_id: str, db: AsyncSession = Depends(get_db)):
    """Get dashboard data for a teacher: class stats, student list, attendance rates."""
    fac_result = await db.execute(select(Faculty).where(Faculty.faculty_id == faculty_id))
    faculty = fac_result.scalar_one_or_none()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    # Get all sessions by this teacher
    sessions_result = await db.execute(
        select(FacultySession).where(FacultySession.faculty_id == faculty.id)
        .order_by(FacultySession.session_start.desc())
    )
    sessions = sessions_result.scalars().all()

    # Active session info
    active_session = None
    active_attendance = []
    for s in sessions:
        if s.is_active:
            att = await db.execute(
                select(AttendanceLog).where(AttendanceLog.session_id == s.id)
            )
            active_attendance = att.scalars().all()
            active_session = {
                "id": s.id,
                "subject_name": s.subject_name,
                "session_start": s.session_start.isoformat() if s.session_start else None,
                "geofence_radius_meters": s.geofence_radius_meters,
                "attendance_count": len(active_attendance),
                "students": [
                    {
                        "student_id": a.student.student_id if a.student else None,
                        "name": f"{a.student.first_name} {a.student.last_name}" if a.student else "Unknown",
                        "confidence": a.confidence,
                        "marked_by": a.marked_by,
                        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                    }
                    for a in active_attendance
                ],
            }
            break

    # Total students
    total_students = await db.execute(select(func.count(Student.id)))

    # Session history
    session_history = [
        {
            "id": s.id,
            "subject_name": s.subject_name,
            "session_start": s.session_start.isoformat() if s.session_start else None,
            "session_end": s.session_end.isoformat() if s.session_end else None,
            "is_active": s.is_active,
            "attendance_count": len(s.attendance_records) if s.attendance_records else 0,
        }
        for s in sessions[:20]
    ]

    return {
        "faculty": {
            "id": faculty.faculty_id,
            "name": f"{faculty.first_name} {faculty.last_name}",
            "department": faculty.department,
        },
        "active_session": active_session,
        "total_students": total_students.scalar() or 0,
        "total_sessions": len(sessions),
        "session_history": session_history,
    }
