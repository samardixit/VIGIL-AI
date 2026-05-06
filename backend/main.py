"""
VIGIL-AI — High-Security Student Attendance System
FastAPI Application Entry Point

Starts the server with:
    uvicorn backend.main:app --reload
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Allow running Uvicorn from inside the backend folder.
# The project uses absolute imports like backend.routes, so we ensure
# the repository root is on sys.path before importing internal modules.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database.connection import engine
from backend.database.models import Base
from backend.websocket.manager import ws_manager

# Import all route modules
from backend.routes import auth, students, sessions, attendance, chat, dashboard

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vigil-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.
    - On startup: Create database tables if they don't exist
    - On shutdown: Dispose of the database engine
    """
    logger.info("🚀 VIGIL-AI starting up...")

    # Create all tables (if they don't exist)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables verified/created")

    yield

    # Shutdown
    await engine.dispose()
    logger.info("👋 VIGIL-AI shut down")


# Create FastAPI application
app = FastAPI(
    title="VIGIL-AI",
    description="High-Security Student Attendance System with GPS Geofencing & Face Recognition",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(sessions.router)
app.include_router(attendance.router)
app.include_router(chat.router)
app.include_router(dashboard.router)


# ── WebSocket endpoint ────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str = "global"):
    """
    WebSocket endpoint for real-time attendance feed.
    Clients connect with a session_id to receive live updates
    when students scan in.
    """
    await ws_manager.connect(websocket, session_id)
    try:
        while True:
            # Keep the connection alive; listen for client messages
            data = await websocket.receive_text()
            # Echo or handle client messages if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, session_id)


# ── Health check ──────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "VIGIL-AI",
        "version": "1.0.0",
        "message": "High-Security Student Attendance System is running",
    }


@app.get("/api/health", tags=["Health"])
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "websocket": "ready",
        "services": {
            "geofence": "active",
            "face_recognition": "standby",
            "gemini_chatbot": "standby",
        },
    }


