"""
VIGIL-AI Student Routes
CRUD operations for student records and attendance history.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from backend.database.connection import get_db
from backend.database.models import Student, AttendanceLog

router = APIRouter(prefix="/api/students", tags=["Students"])


# ── Schemas ───────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None


class StudentResponse(BaseModel):
    id: int
    student_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    department: Optional[str]
    semester: Optional[int]

    class Config:
        from_attributes = True


# ── Routes ────────────────────────────────────────────────────────

@router.get("/", response_model=List[StudentResponse])
async def get_all_students(db: AsyncSession = Depends(get_db)):
    """Get all registered students."""
    result = await db.execute(select(Student).order_by(Student.student_id))
    students = result.scalars().all()
    return students


@router.get("/{student_id}")
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    """Get a student by their student ID."""
    result = await db.execute(
        select(Student).where(Student.student_id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found",
        )

    return {
        "id": student.id,
        "student_id": student.student_id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "phone": student.phone,
        "department": student.department,
        "semester": student.semester,
    }


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(request: StudentCreate, db: AsyncSession = Depends(get_db)):
    """Register a new student."""
    # Check if student already exists
    existing = await db.execute(
        select(Student).where(
            (Student.student_id == request.student_id) | (Student.email == request.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student with this ID or email already exists",
        )

    student = Student(
        student_id=request.student_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        phone=request.phone,
        department=request.department,
        semester=request.semester,
        face_image_path=f"student_db/{request.student_id}",
    )

    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


@router.get("/{student_id}/attendance")
async def get_student_attendance(student_id: str, db: AsyncSession = Depends(get_db)):
    """Get full attendance history for a student."""
    # Get the student
    result = await db.execute(
        select(Student).where(Student.student_id == student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found",
        )

    # Get attendance records
    records_result = await db.execute(
        select(AttendanceLog)
        .where(AttendanceLog.student_id == student.id)
        .order_by(AttendanceLog.timestamp.desc())
    )
    records = records_result.scalars().all()

    return {
        "student_id": student.student_id,
        "student_name": f"{student.first_name} {student.last_name}",
        "total_records": len(records),
        "records": [
            {
                "id": r.id,
                "session_id": r.session_id,
                "subject": r.session.subject_name if r.session else "Unknown",
                "confidence": r.confidence,
                "is_live": r.is_live,
                "marked_by": r.marked_by,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in records
        ],
    }
