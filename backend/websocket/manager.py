"""
VIGIL-AI WebSocket Connection Manager
Manages real-time WebSocket connections for live attendance feed.
"""

import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time attendance updates.

    When a student scans in, the backend broadcasts the event to all
    connected clients (both teacher and student dashboards) so they
    see live updates without polling.
    """

    def __init__(self):
        # Active connections grouped by session ID
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (not tied to a specific session)
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, session_id: str = "global"):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if session_id == "global":
            self.global_connections.append(websocket)
        else:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = []
            self.active_connections[session_id].append(websocket)
        logger.info(f"WebSocket connected: session={session_id}")

    def disconnect(self, websocket: WebSocket, session_id: str = "global"):
        """Remove a disconnected WebSocket."""
        if session_id == "global":
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
        else:
            if session_id in self.active_connections:
                if websocket in self.active_connections[session_id]:
                    self.active_connections[session_id].remove(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
        logger.info(f"WebSocket disconnected: session={session_id}")

    async def broadcast_to_session(self, session_id: str, message: dict):
        """Broadcast a message to all connections in a specific session."""
        connections = self.active_connections.get(session_id, [])
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn, session_id)

    async def broadcast_global(self, message: dict):
        """Broadcast a message to all global connections."""
        disconnected = []
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn, "global")

    async def broadcast_attendance_event(
        self,
        session_id: int,
        student_name: str,
        student_id: str,
        confidence: float,
        method: str = "biometric",
    ):
        """
        Broadcast an attendance marking event to relevant clients.

        This is called whenever a student successfully marks attendance,
        either through biometric scan or manual override.
        """
        event = {
            "type": "attendance_marked",
            "session_id": session_id,
            "student_name": student_name,
            "student_id": student_id,
            "confidence": confidence,
            "method": method,
            "timestamp": None,  # Will be set by frontend
        }

        # Broadcast to session-specific connections
        await self.broadcast_to_session(str(session_id), event)

        # Also broadcast globally for the real-time feed
        await self.broadcast_global(event)


# Singleton instance
ws_manager = ConnectionManager()
