"""
VIGIL-AI Authentication Routes
Handles login for students and faculty, and faculty registration.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.database.connection import get_db
from backend.database.models import Student, Faculty
from backend.core.security import (
    verify_password,
    hash_password,
    create_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Request/Response Schemas ──────────────────────────────────────

class StudentLoginRequest(BaseModel):
    student_id: str


class FacultyLoginRequest(BaseModel):
    email: str
    password: str


class FacultyRegisterRequest(BaseModel):
    faculty_id: str
    first_name: str
    last_name: str
    email: str
    department: Optional[str] = None
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: dict


# ── Routes ────────────────────────────────────────────────────────

@router.post("/login/student", response_model=TokenResponse)
async def login_student(request: StudentLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Student login by student ID (no password — biometric is the auth).
    Returns JWT token with student role.
    """
    result = await db.execute(
        select(Student).where(Student.student_id == request.student_id)
    )
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{request.student_id}' not found",
        )

    # Create JWT token with student claims
    token = create_access_token(
        data={
            "sub": str(student.id),
            "student_id": student.student_id,
            "role": "student",
            "name": f"{student.first_name} {student.last_name}",
        }
    )

    return TokenResponse(
        access_token=token,
        role="student",
        user={
            "id": student.id,
            "student_id": student.student_id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "department": student.department,
            "semester": student.semester,
        },
    )


@router.post("/login/faculty", response_model=TokenResponse)
async def login_faculty(request: FacultyLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Faculty login with email and password.
    Password is verified against bcrypt hash stored in database.
    """
    result = await db.execute(
        select(Faculty).where(Faculty.email == request.email)
    )
    faculty = result.scalar_one_or_none()

    if not faculty or not verify_password(request.password, faculty.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token with faculty claims
    token = create_access_token(
        data={
            "sub": str(faculty.id),
            "faculty_id": faculty.faculty_id,
            "role": "faculty",
            "name": f"{faculty.first_name} {faculty.last_name}",
        }
    )

    return TokenResponse(
        access_token=token,
        role="faculty",
        user={
            "id": faculty.id,
            "faculty_id": faculty.faculty_id,
            "first_name": faculty.first_name,
            "last_name": faculty.last_name,
            "email": faculty.email,
            "department": faculty.department,
        },
    )


@router.post("/register/faculty", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_faculty(request: FacultyRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Register a new faculty member.
    Password is hashed with bcrypt before storage.
    """
    # Check if email already exists
    existing = await db.execute(
        select(Faculty).where(
            (Faculty.email == request.email) | (Faculty.faculty_id == request.faculty_id)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faculty with this email or ID already exists",
        )

    # Create faculty record
    faculty = Faculty(
        faculty_id=request.faculty_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        department=request.department,
        password_hash=hash_password(request.password),
    )

    db.add(faculty)
    await db.commit()
    await db.refresh(faculty)

    # Create JWT token
    token = create_access_token(
        data={
            "sub": str(faculty.id),
            "faculty_id": faculty.faculty_id,
            "role": "faculty",
            "name": f"{faculty.first_name} {faculty.last_name}",
        }
    )

    return TokenResponse(
        access_token=token,
        role="faculty",
        user={
            "id": faculty.id,
            "faculty_id": faculty.faculty_id,
            "first_name": faculty.first_name,
            "last_name": faculty.last_name,
            "email": faculty.email,
            "department": faculty.department,
        },
    )
