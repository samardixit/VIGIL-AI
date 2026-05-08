"""
VIGIL-AI Biometric Scanner Service
Uses DeepFace for face verification and liveness detection.

DeepFace.find() scans a webcam frame against a database of known faces
and returns match results with confidence scores. The anti_spoofing flag
uses MiniVision's Silent Face Anti-Spoofing to detect printed photos,
screen displays, and basic mask attacks.
"""

import base64
import logging
import os
import uuid
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Path to student face database. Each subdirectory is a student ID.
STUDENT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "student_db")

# Facenet512 + MTCNN is more reliable than the old VGG-Face + OpenCV cache
# for webcam scans with varied lighting, pose, and face alignment.
FACE_MODEL_NAME = "Facenet512"
FACE_DETECTOR_BACKEND = "mtcnn"
FACE_DISTANCE_METRIC = "cosine"
FACE_NORMALIZATION = "Facenet"
FACE_EXPAND_PERCENTAGE = 10
FACE_MATCH_THRESHOLD = 0.30
FACE_ANTI_SPOOFING = os.getenv("FACE_ANTI_SPOOFING", "false").lower() == "true"


def _decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode a base64-encoded image string to an OpenCV numpy array.

    Args:
        image_base64: Base64-encoded image (may include data URI prefix).

    Returns:
        OpenCV image as numpy array (BGR format).
    """
    # Strip the data URI prefix if present (e.g., "data:image/jpeg;base64,")
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    image_bytes = base64.b64decode(image_base64)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Failed to decode image from base64 data")

    return img


def _save_temp_image(img: np.ndarray) -> str:
    """Save image to a temporary file and return the path."""
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_frames")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"frame_{uuid.uuid4().hex[:8]}.jpg")
    cv2.imwrite(temp_path, img)
    return temp_path


def _cleanup_temp(path: str):
    """Remove temporary image file."""
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def _extract_student_id(match_path: str) -> Optional[str]:
    """Extract the student ID from a DeepFace match path."""
    path_parts = match_path.replace("\\", "/").split("/")
    for index, part in enumerate(path_parts):
        if part == "student_db" and index + 1 < len(path_parts):
            return path_parts[index + 1]
    return None


def _extract_distance(best_match) -> float:
    """Read the distance column across DeepFace versions and cache formats."""
    return float(
        best_match.get(
            "distance",
            best_match.get(
                f"{FACE_MODEL_NAME}_{FACE_DISTANCE_METRIC}",
                FACE_MATCH_THRESHOLD,
            ),
        )
    )


async def verify_face(
    image_base64: str,
    student_id: Optional[str] = None,
) -> dict:
    """
    Verify a face from a webcam frame against the student face database.

    This function:
    1. Decodes the base64 webcam frame to an image
    2. Uses DeepFace.find() to search for matching faces in student_db/
    3. Applies anti-spoofing (liveness detection) to prevent photo attacks
    4. Returns verification result with confidence score

    Args:
        image_base64: Base64-encoded webcam frame.
        student_id: Optional specific student ID to verify against.
            If None, searches entire database.

    Returns:
        Dictionary with verification status, confidence, liveness, matched
        student ID, and a human-readable message.
    """
    temp_path = None

    try:
        # Lazy import DeepFace to avoid loading TF at startup.
        from deepface import DeepFace

        img = _decode_base64_image(image_base64)
        temp_path = _save_temp_image(img)

        if student_id:
            db_path = os.path.join(STUDENT_DB_PATH, student_id)
            if not os.path.exists(db_path):
                return {
                    "verified": False,
                    "confidence": 0.0,
                    "is_live": False,
                    "student_id": None,
                    "message": f"No face data found for student {student_id}",
                }
        else:
            db_path = STUDENT_DB_PATH

        if not os.path.exists(db_path):
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": False,
                "student_id": None,
                "message": "Student face database not found",
            }

        results = DeepFace.find(
            img_path=temp_path,
            db_path=db_path,
            model_name=FACE_MODEL_NAME,
            detector_backend=FACE_DETECTOR_BACKEND,
            distance_metric=FACE_DISTANCE_METRIC,
            align=True,
            normalization=FACE_NORMALIZATION,
            expand_percentage=FACE_EXPAND_PERCENTAGE,
            threshold=FACE_MATCH_THRESHOLD,
            enforce_detection=True,
            anti_spoofing=FACE_ANTI_SPOOFING,
            silent=True,
        )

        if results and len(results) > 0 and len(results[0]) > 0:
            best_match = results[0].iloc[0]
            matched_student_id = _extract_student_id(best_match["identity"])
            distance = _extract_distance(best_match)
            confidence = max(0.0, min(1.0, 1.0 - (distance / FACE_MATCH_THRESHOLD)))

            return {
                "verified": True,
                "confidence": round(confidence, 4),
                "is_live": True,
                "student_id": matched_student_id,
                "message": (
                    f"Face verified for {matched_student_id} "
                    f"(confidence: {confidence:.1%})"
                ),
            }

        return {
            "verified": False,
            "confidence": 0.0,
            "is_live": True,
            "student_id": None,
            "message": "No matching face found in database",
        }

    except Exception as e:
        error_msg = str(e).lower()

        if "spoof" in error_msg or "fake" in error_msg or "not real" in error_msg:
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": False,
                "student_id": None,
                "message": "Liveness check failed - possible spoof detected",
            }

        if "no face" in error_msg or "could not find" in error_msg:
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": False,
                "student_id": None,
                "message": "No face detected in the frame. Please look directly at the camera.",
            }

        logger.error("Face verification error: %s", e)
        return {
            "verified": False,
            "confidence": 0.0,
            "is_live": False,
            "student_id": None,
            "message": f"Verification error: {str(e)}",
        }

    finally:
        if temp_path:
            _cleanup_temp(temp_path)
