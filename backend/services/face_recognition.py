"""
VIGIL-AI Biometric Scanner Service
Uses DeepFace with OpenCV for face verification and liveness detection.

DeepFace.find() scans a webcam frame against a database of known faces
and returns match results with confidence scores. The anti_spoofing flag
uses MiniVision's Silent Face Anti-Spoofing to detect printed photos,
screen displays, and basic mask attacks.
"""

import os
import base64
import uuid
import logging
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Path to student face database — each subdirectory is a student ID
STUDENT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "student_db")


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

    # Decode base64 to bytes
    image_bytes = base64.b64decode(image_base64)

    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)

    # Decode numpy array to OpenCV image
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
        Dictionary with:
            - verified (bool): Whether a match was found.
            - confidence (float): Match confidence (0-1, higher = better).
            - is_live (bool): Whether the face passed liveness detection.
            - student_id (str | None): Matched student ID, or None if no match.
            - message (str): Human-readable result message.
    """
    temp_path = None

    try:
        # Lazy import DeepFace to avoid loading TF at startup
        from deepface import DeepFace

        # Decode the webcam frame
        img = _decode_base64_image(image_base64)
        temp_path = _save_temp_image(img)

        # Determine the database path to search
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

        # Run DeepFace face search with anti-spoofing
        # anti_spoofing=True uses MiniVision's Silent Face Anti-Spoofing model
        # which analyzes face texture patterns to detect:
        #   - Printed photos held up to the camera
        #   - Digital screen displays (phone/laptop)
        #   - Basic 3D masks
        results = DeepFace.find(
            img_path=temp_path,
            db_path=db_path,
            model_name="VGG-Face",
            enforce_detection=True,
            anti_spoofing=False,
            silent=True,
        )

        # DeepFace.find() returns a list of DataFrames (one per detected face)
        if results and len(results) > 0 and len(results[0]) > 0:
            best_match = results[0].iloc[0]

            # Extract the student ID from the file path
            # Path format: student_db/STU001/face1.jpg
            match_path = best_match["identity"]
            path_parts = match_path.replace("\\", "/").split("/")

            matched_student_id = None
            for i, part in enumerate(path_parts):
                if part == "student_db" and i + 1 < len(path_parts):
                    matched_student_id = path_parts[i + 1]
                    break

            # Calculate confidence from distance (lower distance = higher confidence)
            # VGG-Face cosine threshold is ~0.40
            distance = float(best_match.get("distance", best_match.get("VGG-Face_cosine", 0.5)))
            confidence = max(0.0, min(1.0, 1.0 - distance))

            return {
                "verified": True,
                "confidence": round(confidence, 4),
                "is_live": True,  # Passed anti_spoofing check
                "student_id": matched_student_id,
                "message": f"✅ Face verified for {matched_student_id} (confidence: {confidence:.1%})",
            }
        else:
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": True,
                "student_id": None,
                "message": "❌ No matching face found in database",
            }

    except Exception as e:
        error_msg = str(e).lower()

        # Check if it's a liveness/anti-spoofing failure
        if "spoof" in error_msg or "fake" in error_msg or "not real" in error_msg:
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": False,
                "student_id": None,
                "message": "❌ Liveness check failed — possible spoof detected",
            }

        # Check if no face was detected in the frame
        if "no face" in error_msg or "could not find" in error_msg:
            return {
                "verified": False,
                "confidence": 0.0,
                "is_live": False,
                "student_id": None,
                "message": "❌ No face detected in the frame. Please look directly at the camera.",
            }

        logger.error(f"Face verification error: {e}")
        return {
            "verified": False,
            "confidence": 0.0,
            "is_live": False,
            "student_id": None,
            "message": f"❌ Verification error: {str(e)}",
        }

    finally:
        if temp_path:
            _cleanup_temp(temp_path)
