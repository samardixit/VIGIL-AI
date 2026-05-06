"""
VIGIL-AI Chat Routes
Gemini AI chatbot endpoint with attendance context.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from backend.database.connection import get_db
from backend.database.models import Student, AttendanceLog, FacultySession
from backend.services.gemini_service import get_chat_response
from backend.core.security import get_current_user

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Send a message to Gemini with attendance context."""
    context = {
        "user_name": current_user.get("name", "Unknown"),
        "user_role": current_user.get("role", "unknown"),
    }

    # Add role-specific context
    if current_user.get("role") == "student":
        sid = current_user.get("student_id")
        if sid:
            stu = await db.execute(select(Student).where(Student.student_id == sid))
            student = stu.scalar_one_or_none()
            if student:
                att_count = await db.execute(
                    select(func.count(AttendanceLog.id)).where(AttendanceLog.student_id == student.id)
                )
                total_sess = await db.execute(select(func.count(FacultySession.id)))
                attended = att_count.scalar() or 0
                total = total_sess.scalar() or 0
                pct = (attended / total * 100) if total > 0 else 0
                context.update({
                    "student_id": sid,
                    "department": student.department or "N/A",
                    "total_sessions": total,
                    "attended_sessions": attended,
                    "attendance_percentage": f"{pct:.1f}%",
                    "status": "safe" if pct >= 75 else ("warning" if pct >= 60 else "danger"),
                })

    # Get active sessions info
    active = await db.execute(select(FacultySession).where(FacultySession.is_active == True))
    active_sessions = active.scalars().all()
    context["active_sessions_count"] = len(active_sessions)
    if active_sessions:
        context["active_classes"] = ", ".join(
            [f"{s.subject_name} by {s.faculty.first_name} {s.faculty.last_name}" for s in active_sessions if s.faculty]
        )

    history = [{"role": m.role, "content": m.content} for m in (request.history or [])]

    result = await get_chat_response(
        message=request.message,
        context=context,
        chat_history=history,
    )

    return {
        "response": result["response"],
        "success": result["success"],
    }
