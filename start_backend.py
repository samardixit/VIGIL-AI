import uvicorn
import os
import sys
from pathlib import Path

# Add the project root to sys.path to ensure 'backend' is found
root_path = Path(__file__).resolve().parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

if __name__ == "__main__":
    print(f"🚀 Starting VIGIL-AI Backend from {root_path}")
    print("💡 If you see 'ModuleNotFoundError', ensure you are running this from the root directory.")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
