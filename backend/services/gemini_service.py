"""
VIGIL-AI Gemini AI Chatbot Service
Uses Google's Generative AI (Gemini) to answer attendance-related questions.

The chatbot has access to attendance context and can answer natural language
questions about student attendance, active sessions, and teacher availability.
"""

import logging
from typing import Optional

from backend.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# System prompt that gives the AI context about its role and capabilities
SYSTEM_PROMPT = """You are VIGIL-AI Assistant, an intelligent chatbot embedded in the VIGIL-AI High-Security Student Attendance System.

Your role:
- Help students and faculty with attendance-related queries
- Provide information about attendance statistics, active sessions, and schedules
- Explain how the biometric attendance system works
- Answer questions about geofencing, face recognition, and liveness detection
- Be friendly, concise, and professional

System Context:
- Students mark attendance through GPS verification + face recognition
- Attendance can only be marked within 10 minutes of class start
- A 20-meter geofence radius is used for location verification
- Teachers can manually override attendance for individual students
- 75% attendance threshold is required (shown as a health bar)
- DeepFace with anti-spoofing is used for face verification

When providing attendance data, format it clearly with percentages and counts.
If you don't have specific data, explain what the system tracks and suggest checking the dashboard.
Always respond in a helpful, concise manner. Use emoji sparingly for friendly tone.
"""


async def get_chat_response(
    message: str,
    context: Optional[dict] = None,
    chat_history: Optional[list] = None,
) -> dict:
    """
    Send a message to Gemini and get a response with attendance context.

    Args:
        message: User's chat message.
        context: Optional attendance context (student data, stats, etc.).
        chat_history: Optional list of previous messages for conversation continuity.

    Returns:
        Dictionary with:
            - response (str): The AI's response text.
            - success (bool): Whether the request succeeded.
            - error (str | None): Error message if failed.
    """
    try:
        import google.generativeai as genai

        # Configure the API
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Create the model
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        # Build the context-enriched prompt
        enriched_prompt = message
        if context:
            context_str = "\n".join([f"- {k}: {v}" for k, v in context.items()])
            enriched_prompt = (
                f"User's attendance context:\n{context_str}\n\n"
                f"User's question: {message}"
            )

        # Build chat history for conversation continuity
        history = []
        if chat_history:
            for msg in chat_history:
                role = "user" if msg.get("role") == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

        # Start chat with history
        chat = model.start_chat(history=history)

        # Send message and get response
        response = chat.send_message(enriched_prompt)

        return {
            "response": response.text,
            "success": True,
            "error": None,
        }

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return {
            "response": (
                "I'm having trouble connecting to my AI brain right now. "
                "Please try again in a moment, or check your dashboard for attendance info. 🔧"
            ),
            "success": False,
            "error": str(e),
        }
