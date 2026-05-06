# VIGIL-AI

VIGIL-AI is a high-security student attendance platform that combines GPS geofencing, live facial verification, liveness checks, faculty session tracking, and an AI assistant into one classroom workflow.

The repository is split into a FastAPI backend and a React + Vite frontend. Students can scan into an active classroom session only when they are within the teacher-defined geofence, while faculty and admins can monitor attendance, manage sessions, and handle manual verification when needed.

## Highlights

- Live attendance capture with DeepFace and OpenCV
- Teacher-student geofence handshake using live classroom coordinates
- Faculty session management with active classroom radius control
- Real-time status feed over WebSockets
- JWT-based authentication for protected workflows
- Gemini-powered classroom assistant for attendance and session queries
- Dashboard widgets for attendance health, heatmaps, and live scan activity
- SQLAlchemy ORM models for students, faculty, sessions, and attendance logs

## Architecture

### Backend

The backend is built with FastAPI and organized into feature-focused modules:

- `backend/main.py`: app entry point, CORS, lifespan hooks, WebSocket endpoint
- `backend/routes/`: API routes for auth, students, sessions, attendance, chat, and dashboard
- `backend/services/`: geofence logic, face recognition, and Gemini integration
- `backend/database/`: async DB connection, ORM models, and SQL schema
- `backend/websocket/`: real-time scan/status broadcast management
- `backend/student_db/`: local biometric reference images used for matching

### Frontend

The frontend is a React app built with Vite:

- `frontend/src/pages/`: login, scan page, student dashboard, teacher dashboard
- `frontend/src/components/`: health bar, heatmap, status feed, chatbot sidebar, stats cards
- `frontend/src/services/`: API and WebSocket client helpers
- `frontend/src/context/`: authentication state management

## Core Workflow

1. A faculty member starts a classroom session with live coordinates.
2. The system creates a geofence around the active session radius.
3. A student opens the scanner and shares location.
4. If the student is inside the geofence, webcam-based verification begins.
5. The face is matched against the local `student_db` reference set.
6. Liveness and confidence checks are applied before attendance is logged.
7. The dashboard and live feed update in real time.

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- SQLAlchemy Async ORM
- MySQL via `aiomysql`
- DeepFace
- OpenCV
- JWT auth with `python-jose`
- Password hashing with `passlib`
- Google Gemini via `google-generativeai`

### Frontend

- React
- Vite
- React Router
- Chart.js
- Axios
- React Webcam

## Database Model

The application currently includes these main entities:

- `students`: student bio-data and biometric reference paths
- `faculty`: faculty accounts and credentials
- `faculty_sessions`: active or historical classroom sessions with GPS coordinates
- `attendance_log`: biometric/manual attendance records with timestamp, GPS, and confidence

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/samardixit/VIGIL-AI.git
cd VIGLI_AI
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/` and configure your database, JWT, and Gemini values.

Typical values include:

```env
DATABASE_URL=mysql+aiomysql://user:password@localhost/vigil_ai
SECRET_KEY=change_this_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
GEMINI_API_KEY=your_gemini_key
```

Start the backend:

```bash
uvicorn backend.main:app --reload
```

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will usually run on `http://localhost:5173` and connect to the backend on `http://127.0.0.1:8000`.

## API Areas

The backend currently exposes route groups for:

- `/auth`
- `/students`
- `/sessions`
- `/attendance`
- `/chat`
- `/dashboard`
- `/ws/{session_id}` for real-time updates

Health endpoints:

- `/`
- `/api/health`

## Manual Scripts

The repo also includes helper scripts at the root:

- `create_db.py`: database initialization helper
- `seed_db.py`: seed sample records
- `update_hash.py`: update or generate password hashes

## Notes

- The repo currently includes local student reference images in `backend/student_db/` for development and testing.
- The backend requirements are pinned for reproducibility.
- `frontend/node_modules/` and `backend/.venv/` are currently present locally; they are not typically committed in production repositories.

## Roadmap Ideas

- Admin override audit trail in the dashboard
- Better anti-spoofing beyond baseline liveness checks
- Attendance analytics by subject and semester
- Deployment with Docker and reverse proxy support
- CI pipeline for backend and frontend validation

## License

No license file is currently included in this repository. Add one if you plan to distribute or open-source the project.
