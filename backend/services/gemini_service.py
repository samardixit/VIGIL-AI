"""
VIGIL-AI Gemini AI Chatbot Service.

The chatbot prefers Gemini when a valid API key is configured. If Gemini is
unavailable, it falls back to deterministic attendance answers instead of
showing the same connection error for every question.
"""

import logging
from typing import Optional

from backend.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are VIGIL-AI Assistant, an intelligent chatbot embedded in the VIGIL-AI High-Security Student Attendance System.

Your role:
- Help students and faculty with attendance-related queries
- Provide information about attendance statistics, active sessions, and schedules
- Explain how the biometric attendance system works
- Answer questions about geofencing, face recognition, and liveness detection
- Be friendly, concise, and professional

System Context:
- Students mark attendance through GPS verification + face recognition
- Attendance can only be marked within the configured attendance window
- A 20-meter default geofence radius is used for location verification
- Teachers can manually override attendance for individual students
- 75% attendance threshold is required
- DeepFace is used for face verification

When providing attendance data, format it clearly with percentages and counts.
If you don't have specific data, explain what the system tracks and suggest checking the dashboard.
Always respond in a helpful, concise manner.
"""

PLACEHOLDER_KEYS = {"", "YOUR_GEMINI_API_KEY_HERE", "your_gemini_key"}
FALLBACK_GEMINI_MODELS = (
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
)


def _has_valid_gemini_key() -> bool:
    """Return whether Gemini has a usable API key configured."""
    key = (settings.GEMINI_API_KEY or "").strip()
    return key not in PLACEHOLDER_KEYS


def _candidate_model_names() -> list[str]:
    """Return configured model plus known good fallbacks, without duplicates."""
    seen = set()
    candidates = []

    for model_name in (settings.GEMINI_MODEL, *FALLBACK_GEMINI_MODELS):
        model_name = (model_name or "").strip()
        if model_name.startswith("models/"):
            model_name = model_name.removeprefix("models/")
        if model_name and model_name not in seen:
            seen.add(model_name)
            candidates.append(model_name)

    return candidates


def _is_model_not_found_error(error: Exception) -> bool:
    """Detect stale/unsupported Gemini model names."""
    message = str(error).lower()
    return (
        "model" in message
        and (
            "not found" in message
            or "not supported for generatecontent" in message
        )
    )


def _normalize_chat_history(
    chat_history: Optional[list],
    current_message: str,
) -> list[dict]:
    """Convert UI history into valid alternating Gemini chat turns."""
    normalized = []
    current_message = current_message.strip()

    for msg in chat_history or []:
        content = str(msg.get("content", "")).strip()
        if not content:
            continue

        role = "user" if msg.get("role") == "user" else "model"

        # The UI starts with a local welcome message. Gemini history should not
        # start with a model turn, and the current question is sent separately.
        if role == "model" and not normalized:
            continue
        if role == "user" and content == current_message:
            continue

        if normalized and normalized[-1]["role"] == role:
            normalized[-1]["parts"][0] += f"\n{content}"
        else:
            normalized.append({"role": role, "parts": [content]})

    while normalized and normalized[0]["role"] != "user":
        normalized.pop(0)

    if normalized and normalized[-1]["role"] == "user":
        normalized.pop()

    return normalized[-10:]


def _build_enriched_prompt(message: str, context: Optional[dict]) -> str:
    """Attach attendance context to the user's message."""
    if not context:
        return message

    context_str = "\n".join([f"- {key}: {value}" for key, value in context.items()])
    return f"User's attendance context:\n{context_str}\n\nUser's question: {message}"


def _local_attendance_response(message: str, context: Optional[dict] = None) -> str:
    """Useful local fallback when Gemini cannot answer."""
    context = context or {}
    question = message.lower()
    role = context.get("user_role", "user")

    if any(word in question for word in ("attendance", "percentage", "percent", "present")):
        if role == "student" and "attendance_percentage" in context:
            return (
                f"Your attendance is {context.get('attendance_percentage')} "
                f"({context.get('attended_sessions', 0)} of "
                f"{context.get('total_sessions', 0)} sessions). "
                f"Status: {context.get('status', 'unknown')}."
            )
        return (
            "The dashboard tracks attended sessions, total sessions, attendance "
            "percentage, and whether a student is above the 75% threshold."
        )

    if any(word in question for word in ("active", "class", "session", "teacher", "faculty")):
        count = context.get("active_sessions_count", 0)
        if count:
            classes = context.get("active_classes", "active class details are loading")
            return f"There are {count} active session(s): {classes}."
        return "There are no active class sessions right now."

    if any(word in question for word in ("face", "scan", "biometric", "camera")):
        return (
            "Face scan first checks the student's location, then compares the "
            "webcam image with the enrolled reference image using DeepFace. "
            "The current backend is configured for Facenet512 with MTCNN."
        )

    if any(word in question for word in ("gps", "location", "geofence", "radius")):
        return (
            "GPS verification checks whether the student is inside the active "
            "class geofence before face scanning starts. The default radius is "
            "20 meters unless the teacher sets another value."
        )

    if any(word in question for word in ("liveness", "spoof", "photo", "fake")):
        return (
            "Liveness protection can be enabled with FACE_ANTI_SPOOFING=true. "
            "For local testing with saved photos, it is usually kept off so "
            "reference-image checks do not get rejected as spoof attempts."
        )

    if any(word in question for word in ("hello", "hi", "help")):
        return (
            "Hi, I can help with attendance percentage, active sessions, GPS "
            "geofencing, face scanning, and dashboard questions."
        )

    return (
        "I can help with attendance status, active classes, GPS geofencing, "
        "face verification, and liveness checks. Try asking about your "
        "attendance or active sessions."
    )


async def get_chat_response(
    message: str,
    context: Optional[dict] = None,
    chat_history: Optional[list] = None,
) -> dict:
    """
    Send a message to Gemini and get a response with attendance context.

    Returns a local attendance answer when Gemini is not configured or fails.
    """
    if not _has_valid_gemini_key():
        return {
            "response": _local_attendance_response(message, context),
            "success": True,
            "error": "Gemini API key is not configured.",
        }

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        response = None
        last_model_error = None
        history = _normalize_chat_history(chat_history, message)
        prompt = _build_enriched_prompt(message, context)

        for model_name in _candidate_model_names():
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=SYSTEM_PROMPT,
                )
                chat = model.start_chat(history=history)
                response = chat.send_message(prompt)
                break
            except Exception as model_error:
                if not _is_model_not_found_error(model_error):
                    raise
                last_model_error = model_error
                logger.warning(
                    "Gemini model %s is unavailable, trying fallback",
                    model_name,
                )

        if response is None:
            raise last_model_error or RuntimeError("No Gemini model could answer.")

        return {
            "response": response.text,
            "success": True,
            "error": None,
        }

    except Exception as e:
        logger.exception("Gemini API error")
        return {
            "response": _local_attendance_response(message, context),
            "success": True,
            "error": str(e),
        }
