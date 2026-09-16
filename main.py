"""
ClearMed Backend Entrypoint (Root Proxy)
Forwards to clearmed-backend.main for centralized API logic,
ensuring all endpoints (auth, OCR, Groq analysis, Sarvam audio)
work seamlessly whether run from root or clearmed-backend.
"""
import sys
import os

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clearmed-backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # noqa: F401
