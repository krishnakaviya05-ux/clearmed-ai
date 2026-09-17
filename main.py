"""
ClearMed Backend Entrypoint (Root Proxy)
Forwards to clearmed-backend.main for centralized API logic,
ensuring all endpoints (auth, OCR, Groq analysis, Sarvam audio)
work seamlessly whether run from root or clearmed-backend.
"""
import sys
import os
import importlib.util

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clearmed-backend")
backend_main = os.path.join(backend_dir, "main.py")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

spec = importlib.util.spec_from_file_location("clearmed_backend_main", backend_main)
backend_module = importlib.util.module_from_spec(spec)
sys.modules["clearmed_backend_main"] = backend_module
spec.loader.exec_module(backend_module)

app = backend_module.app
