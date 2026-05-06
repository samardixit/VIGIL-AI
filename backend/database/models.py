"""
VIGIL-AI SQLAlchemy ORM Models
SQLAlchemy 2.0 style with Mapped and mapped_column.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Enum, TIMESTAMP, DECIMAL, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class Student(Base):
    """Student bio-data and face image reference."""
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    semester: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    face_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp()
    )

    # Relationships
    attendance_records: Mapped[list["AttendanceLog"]] = relationship(
        back_populates="student", lazy="selectin"
    )

    def __repr__(self):
        return f"<Student {self.student_id}: {self.first_name} {self.last_name}>"


class Faculty(Base):
    """Faculty member with authentication credentials."""
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )

    # Relationships
    sessions: Mapped[list["FacultySession"]] = relationship(
        back_populates="faculty", lazy="selectin"
    )

    def __repr__(self):
        return f"<Faculty {self.faculty_id}: {self.first_name} {self.last_name}>"


class FacultySession(Base):
    """Active classroom session with GPS coordinates for geofencing."""
    __tablename__ = "faculty_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty.id"), nullable=False)
    subject_name: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(DECIMAL(10, 8), nullable=False)
    longitude: Mapped[float] = mapped_column(DECIMAL(11, 8), nullable=False)
    geofence_radius_meters: Mapped[int] = mapped_column(Integer, default=20)
    session_start: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )
    session_end: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    faculty: Mapped["Faculty"] = relationship(back_populates="sessions", lazy="selectin")
    attendance_records: Mapped[list["AttendanceLog"]] = relationship(
        back_populates="session", lazy="selectin"
    )

    def __repr__(self):
        return f"<Session {self.id}: {self.subject_name} by Faculty#{self.faculty_id}>"


class AttendanceLog(Base):
    """Individual attendance record linking a student to a session."""
    __tablename__ = "attendance_log"
    __table_args__ = (
        UniqueConstraint("student_id", "session_id", name="unique_attendance"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=False)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty_sessions.id"), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 8), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(DECIMAL(11, 8), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_live: Mapped[bool] = mapped_column(Boolean, default=True)
    marked_by: Mapped[str] = mapped_column(
        Enum("biometric", "manual", name="marked_by_enum"), default="biometric"
    )
    marked_by_faculty_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("faculty.id"), nullable=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="attendance_records", lazy="selectin")
    session: Mapped["FacultySession"] = relationship(back_populates="attendance_records", lazy="selectin")

    def __repr__(self):
        return f"<Attendance Student#{self.student_id} Session#{self.session_id}>"
