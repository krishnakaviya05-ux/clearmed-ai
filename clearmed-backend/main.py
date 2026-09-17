from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Response, Request, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import bcrypt
import hmac
import hashlib
import re
import os
import logging
import requests
import json
import base64
import asyncio
import uuid
import time
from io import BytesIO
from fastapi.responses import FileResponse
from fastapi import BackgroundTasks
from concurrent.futures import ThreadPoolExecutor

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)
load_dotenv(override=True)

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clearmed-backend")

OCR_DEBUG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr_debug.txt")
AUTH_SECRET = os.getenv("AUTH_SECRET", "clearmed_auth_secret_key_2026_salt").encode("utf-8")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")

app = FastAPI(title="ClearMed API")

# Allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:8080",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://krishnakaviya05-ux.github.io",
        "https://clearmed-ai-roan.vercel.app",
        "https://clearmed-20mxl8ptt-aura-kicks.vercel.app",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.github\.io|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB & Resilient Fallback Storage
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
IN_MEMORY_USERS = {}
IN_MEMORY_REPORTS = []

mongo_client = None
reports_collection = None
users_collection = None

try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
    db = mongo_client["clearmed"]
    reports_collection = db["reports"]
    users_collection = db["users"]
    try:
        users_collection.create_index("email", unique=True)
    except Exception as _idx_err:
        logger.warning(f"Could not ensure unique index on users.email: {_idx_err}")
except Exception as _db_init_err:
    logger.warning(f"MongoDB init warning (in-memory storage enabled): {_db_init_err}")

# Password Hashing & Session Helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_session_token(user_id: str, email: str) -> str:
    exp = int(time.time()) + (86400 * 7)  # 7 days
    payload = f"{user_id}:{email}:{exp}"
    signature = hmac.new(AUTH_SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def verify_session_token(token: str) -> Optional[dict]:
    if not token or not isinstance(token, str):
        return None
    parts = token.strip().split(":")
    if len(parts) != 4:
        return None
    user_id, email, exp_str, signature = parts
    try:
        exp = int(exp_str)
        if time.time() > exp:
            return None
    except ValueError:
        return None
    expected_sig = hmac.new(AUTH_SECRET, f"{user_id}:{email}:{exp_str}".encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        return None
    return {"user_id": user_id, "email": email}

def is_production_or_secure(request: Request) -> bool:
    """
    Detects if the request is running in production (Render), over HTTPS,
    or originating from a cross-site production frontend (e.g. GitHub Pages).
    """
    if os.getenv("ENVIRONMENT", "").lower() in ["production", "prod"]:
        return True
    if os.getenv("RENDER") is not None or os.getenv("RENDER_SERVICE_ID") is not None:
        return True
    forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()
    if forwarded_proto == "https" or request.url.scheme == "https":
        return True
    origin = request.headers.get("origin", "").lower()
    if origin.startswith("https://"):
        return True
    return False

def set_auth_cookie(response: Response, request: Request, token: str):
    """
    Sets session cookie with environment-aware SameSite and Secure attributes:
    - In production or HTTPS cross-site (GitHub Pages -> Render): samesite="none", secure=True
    - In local development over HTTP: samesite="lax", secure=False
    """
    secure_mode = is_production_or_secure(request)
    if secure_mode:
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            samesite="none",
            secure=True,
            max_age=86400 * 7,
            path="/"
        )
    else:
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=86400 * 7,
            path="/"
        )

def clear_auth_cookie(response: Response, request: Request):
    """
    Clears session cookie matching the attributes it was set with.
    """
    secure_mode = is_production_or_secure(request)
    if secure_mode:
        response.delete_cookie(
            key="session_token",
            path="/",
            samesite="none",
            secure=True
        )
    else:
        response.delete_cookie(
            key="session_token",
            path="/",
            samesite="lax",
            secure=False
        )

# Auth Schemas
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=6, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    password: str = Field(..., min_length=1, max_length=128)

# Config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SNS_WEBHOOK_URL = os.getenv("SNS_WEBHOOK_URL", "https://api.agents.snsihub.ai/webhook/testing")
SNS_TIMEOUT_SECONDS = int(os.getenv("SNS_TIMEOUT_SECONDS", "180"))

# Thread pool for concurrent SNS + Groq calls
executor = ThreadPoolExecutor(max_workers=4)

# Setup temporary audio storage directory
AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio_temp")
os.makedirs(AUDIO_DIR, exist_ok=True)

def cleanup_old_audio_files():
    """Delete audio files older than 1 hour."""
    try:
        current_time = time.time()
        for filename in os.listdir(AUDIO_DIR):
            filepath = os.path.join(AUDIO_DIR, filename)
            if os.path.isfile(filepath):
                # Check modification time
                if current_time - os.path.getmtime(filepath) > 3600:
                    try:
                        os.remove(filepath)
                        logger.info(f"Cleaned up old audio file: {filename}")
                    except Exception as e:
                        logger.warning(f"Failed to delete {filepath}: {e}")
    except Exception as e:
        logger.error(f"Error during audio cleanup: {e}")


def build_groq_prompt(report_text: str, preferred_language: str) -> str:
    lang_instruction = {
        "tamil": "Provide the simple_explanation and all test explanations in Tamil language.",
        "hindi": "Provide the simple_explanation and all test explanations in Hindi language.",
        "english": "Provide the simple_explanation and all test explanations in English.",
    }.get(preferred_language, "Provide the simple_explanation and all test explanations in English.")

    return f"""You are a medical report analysis assistant. Analyze only the medical report text below and extract information that is explicitly present.

{lang_instruction}

Extract ONLY information actually present in the supplied report text.
Do not infer patient details.
Do not use arbitrary numbers as patient names.
Do not create tests that are not present.
Do not invent reference ranges.
If patient name, age, or sex are missing, return empty strings.
Extract every test present in the report.

For each test:
- name must come from the report
- result must come from the report
- unit must come from the report
- reference_range must come from the report
- status must be based only on the stated range
- if range/result cannot be reliably understood, use UNKNOWN

In tabular rows (e.g. 'Eosinophils 1 00 - 06 %' or 'Monocytes 7 00-10 %' or 'Basophils 1 00-02 %'), the result is the measured single number (e.g. '1', '7', '1'), while the range containing a hyphen/dash is the reference range (e.g. '00 - 06', '00 - 10', '00 - 02'). Do NOT merge the result with the reference range.

Return ONLY a valid JSON object with EXACTLY this structure (no markdown, no extra text):

{{
  "patient_name": "...",
  "age": "...",
  "sex": "...",
  "analysis_timestamp": "ISO timestamp",
  "tests": [
    {{
      "id": "test-1",
      "name": "Test name in the report",
      "result": "exact numeric value as string",
      "unit": "unit from report",
      "reference_range": "exact range from report",
      "status": "NORMAL or HIGH or LOW or UNKNOWN",
      "explanation": "patient-friendly explanation in {preferred_language}"
    }}
  ],
  "simple_explanation": "overall patient-friendly summary in {preferred_language}",
  "disclaimer": "This report is AI-assisted and should be reviewed by a qualified medical professional."
}}

STRICT RULES:
- Do NOT invent values. Use ONLY what is in the report text.
- Do NOT invent reference ranges. Use ONLY what is printed in the report text.
- Do NOT provide diagnosis or medication recommendations.
- Do NOT infer or state diseases, causes, organ function, infection, or treatment needs.
- Explanations may only restate the reported value, unit, reference range, and status in patient-friendly language.
- status must be exactly: NORMAL, HIGH, LOW, or UNKNOWN
- If a value is above the reference range, use HIGH
- If a value is below the reference range, use LOW
- If within range, use NORMAL
- If not determinable from report, use UNKNOWN
- Return ONLY valid JSON. No markdown. No code fences.

MEDICAL REPORT TEXT:
{report_text}
"""


def extract_report_text(file_bytes: bytes, filename: str, content_type: str) -> str:
    """Extract report text with PyMuPDF first, falling back to high-resolution Tesseract OCR when needed."""
    filename_lower = filename.lower()
    is_pdf = content_type == "application/pdf" or filename_lower.endswith(".pdf")
    is_image = content_type in {"image/jpeg", "image/jpg", "image/png"} or filename_lower.endswith(
        (".jpg", ".jpeg", ".png")
    )
    if not is_pdf and not is_image:
        raise ValueError("Unsupported report format. Please upload a PDF, JPG, JPEG, or PNG file.")

    import pymupdf as fitz
    import shutil

    tesseract_candidates = [
        os.getenv("TESSERACT_CMD"),
        shutil.which("tesseract"),
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
        "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
        "C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe",
        os.path.expanduser("~\\AppData\\Local\\Programs\\Tesseract-OCR\\tesseract.exe"),
    ]
    tesseract_path = next((path for path in tesseract_candidates if path and os.path.isfile(path)), None)

    page_count = 1
    normal_char_count = 0
    ocr_char_count = 0
    report_text = ""

    if is_pdf:
        try:
            document = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as exc:
            logger.error(f"PDF opening failed: {exc}")
            raise ValueError("Unable to read the uploaded PDF.") from exc

        page_count = len(document)
        normal_text = "\n\n".join(page.get_text("text").strip() for page in document).strip()
        normal_char_count = len(normal_text)

        # If normal PDF text extraction returns good text (>= 50 chars), use it directly
        if normal_char_count >= 50:
            document.close()
            report_text = normal_text
        else:
            # Scanned PDF: need OCR
            logger.info(
                f"Normal PDF text extraction returned {normal_char_count} chars. "
                f"Attempting high-resolution Tesseract OCR on all {page_count} pages."
            )
            if tesseract_path:
                try:
                    import pytesseract
                    from PIL import Image
                    pytesseract.pytesseract.tesseract_cmd = tesseract_path
                    ocr_pages = []
                    for page in document:
                        pixmap = page.get_pixmap(matrix=fitz.Matrix(2.3, 2.3), alpha=False)
                        image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
                        page_text = pytesseract.image_to_string(image)
                        ocr_pages.append(page_text)
                    document.close()
                    report_text = "\n\n".join(page.strip() for page in ocr_pages if page.strip()).strip()
                    ocr_char_count = len(report_text)
                except Exception as exc:
                    document.close()
                    logger.warning(f"OCR extraction encountered error: {exc}")
                    if normal_char_count > 0:
                        report_text = normal_text
                    else:
                        raise RuntimeError("Tesseract OCR could not process this scanned report.") from exc
            else:
                document.close()
                if normal_char_count > 0:
                    report_text = normal_text
                else:
                    raise RuntimeError(
                        "This report is a scanned image requiring OCR, but Tesseract OCR executable was not found on the server. Please deploy using Docker."
                    )
    else:
        # Direct image file
        if not tesseract_path:
            raise RuntimeError(
                "Image report requires OCR, but Tesseract OCR executable was not found on the server. Please deploy using Docker."
            )

        try:
            import pytesseract
            from PIL import Image
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            image = Image.open(BytesIO(file_bytes))
            report_text = pytesseract.image_to_string(image).strip()
            ocr_char_count = len(report_text)
        except Exception as exc:
            logger.error(f"Image OCR failed: {exc}")
            raise RuntimeError("Tesseract OCR could not process this image.") from exc

    if not report_text:
        raise ValueError("No readable text could be extracted from this report. Please upload a clearer PDF or image.")

    # Write exact extracted text to ocr_debug.txt
    try:
        with open(OCR_DEBUG_FILE, "w", encoding="utf-8") as f:
            f.write(report_text)
        logger.info(f"Wrote exact extracted text to {OCR_DEBUG_FILE}")
    except Exception as exc:
        logger.warning(f"Could not write to {OCR_DEBUG_FILE}: {exc}")

    # Explicitly log all 4 required metrics
    logger.info(f"PDF page count: {page_count}")
    logger.info(f"Normal text extraction character count: {normal_char_count}")
    logger.info(f"OCR character count: {ocr_char_count}")
    logger.info(f"Final text sent to Groq (character count: {len(report_text)}):\n{report_text}")

    return report_text


def parse_groq_json(raw_text: str) -> dict:
    raw_text = (raw_text or "").strip()
    if not raw_text:
        raise ValueError("Groq returned no usable response")
    if raw_text.startswith("```"):
        lines = raw_text.splitlines()
        raw_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise json.JSONDecodeError("Groq returned malformed JSON", raw_text, exc.pos) from exc
    if not isinstance(data, dict):
        raise ValueError("Groq returned JSON in an unexpected format")
    raw_tests = data.get("tests", [])
    data["tests"] = [test for test in raw_tests if isinstance(test, dict)] if isinstance(raw_tests, list) else []
    return data


def call_groq_analysis(report_text: str, preferred_language: str) -> dict:
    """Analyze extracted report text with the configured Groq model."""
    if not GROQ_API_KEY or GROQ_API_KEY == "YOUR_GROQ_API_KEY":
        raise ValueError("GROQ_API_KEY is not configured in clearmed-backend/.env")
    if not GROQ_MODEL:
        raise ValueError("GROQ_MODEL is not configured in clearmed-backend/.env")

    from groq import Groq

    prompt = build_groq_prompt(report_text, preferred_language)
    client = Groq(api_key=GROQ_API_KEY)
    messages = [
        {"role": "system", "content": "You are a medical data extraction engine. Return ONLY one valid JSON object. Do not use markdown or code fences."},
        {"role": "user", "content": prompt},
    ]
    last_json_error = None
    last_exception = None
    for attempt in range(1, 3):
        try:
            logger.info(f"Groq analysis started | attempt: {attempt}/2 | model: {GROQ_MODEL} | characters: {len(report_text)}")
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=0.0,
                max_tokens=4096,
            )
            content = response.choices[0].message.content if response.choices else ""
            logger.info(f"Groq response length: {len(content or '')} chars | model: {GROQ_MODEL}")
            result = parse_groq_json(content)
            logger.info(f"Groq analysis completed | model: {GROQ_MODEL}")
            return result
        except json.JSONDecodeError as exc:
            logger.warning(f"JSONDecodeError on attempt {attempt}: {exc}")
            last_json_error = exc
            if attempt == 1:
                messages.append({"role": "assistant", "content": content if 'content' in locals() else ""})
                messages.append({"role": "user", "content": "Return ONLY a valid JSON object. No markdown, no code fences. Fix any formatting error and return the full valid JSON."})
                continue
            raise
        except Exception as exc:
            last_exception = exc
            logger.warning(f"Groq call failed on attempt {attempt}: {exc}")
            if attempt == 1:
                time.sleep(1)
                continue
            break

    if last_json_error:
        raise last_json_error
    if last_exception is None:
        raise RuntimeError("Groq analysis failed without a response.")
    status_code = getattr(last_exception, "status_code", None)
    message = str(last_exception).lower()
    if status_code == 404 or "model_not_found" in message:
        raise RuntimeError(
            f"Configured Groq model '{GROQ_MODEL}' is unavailable. Set GROQ_MODEL in clearmed-backend/.env to an available Groq model."
        ) from last_exception
    if status_code in (401, 403) or "authentication" in message or "unauthorized" in message:
        raise RuntimeError("Groq API access is unavailable. Please check the API key and account limits.") from last_exception
    if status_code == 429 or "rate limit" in message or "quota" in message:
        raise RuntimeError("Groq rate limit reached. Please try again later.") from last_exception
    if status_code and status_code >= 500:
        raise RuntimeError("Groq service is temporarily unavailable. Please try again later.") from last_exception
    raise RuntimeError(f"Groq analysis failed: {str(last_exception)[:200]}") from last_exception


def validate_groq_analysis(analysis_data: dict, source_text: str) -> None:
    """Validate Groq output against source OCR text.
    Rejects suspicious outputs where patient_name is only a number,
    tests that do not correspond to source text, or hallucinated reference ranges.
    Raises HTTPException(422) if validation fails.
    """
    error_detail = "Unable to reliably extract the medical report. Please upload a clearer report."

    if not isinstance(analysis_data, dict):
        logger.warning("Validation failed: analysis_data is not a dict")
        raise HTTPException(status_code=422, detail=error_detail)

    patient_name = str(analysis_data.get("patient_name") or "").strip()
    # 1. Reject suspicious outputs where patient_name is only a number
    if patient_name:
        cleaned_name = re.sub(r"[\s\-_:.]", "", patient_name)
        if cleaned_name.isdigit():
            logger.warning(f"Validation failed: suspicious patient_name containing only digits: '{patient_name}'")
            raise HTTPException(status_code=422, detail=error_detail)

    tests = analysis_data.get("tests", [])
    if not isinstance(tests, list) or len(tests) == 0:
        if len(source_text.strip()) > 100:
            logger.warning("Validation failed: 0 tests extracted from non-empty source text")
            raise HTTPException(status_code=422, detail=error_detail)
        return

    source_lower = source_text.lower()

    for i, test in enumerate(tests):
        if not isinstance(test, dict):
            logger.warning(f"Validation failed: test[{i}] is not a dict")
            raise HTTPException(status_code=422, detail=error_detail)

        test_name = str(test.get("name") or "").strip()
        if not test_name:
            logger.warning(f"Validation failed: test[{i}] has empty name")
            raise HTTPException(status_code=422, detail=error_detail)

        # 2. Reject tests that do not correspond to extracted source text
        name_tokens = [
            w for w in re.findall(r"[a-zA-Z]{3,}", test_name.lower())
            if w not in {"the", "and", "count", "total", "rate", "with"}
        ]
        found_name = False
        if name_tokens:
            for token in name_tokens:
                if token in source_lower:
                    found_name = True
                    break
        else:
            found_name = test_name.lower() in source_lower

        # Check abbreviations in parentheses e.g. "(Hb)" -> "hb", "(PCV)" -> "pcv", "(MCV)" -> "mcv"
        abbrevs = re.findall(r"\(([a-zA-Z0-9]+)\)", test_name)
        for abbrev in abbrevs:
            if abbrev.lower() in source_lower:
                found_name = True
                break

        if not found_name:
            logger.warning(f"Validation failed: test name '{test_name}' not found in source text")
            raise HTTPException(status_code=422, detail=error_detail)

        # 3. Reject hallucinated reference ranges
        ref_range = str(test.get("reference_range") or "").strip()
        if ref_range and ref_range.upper() not in {"NOT SPECIFIED", "UNKNOWN", "N/A", "NONE", "-"}:
            range_numbers = re.findall(r"\d+(?:\.\d+)?", ref_range)
            if range_numbers:
                numbers_found = any(num in source_text for num in range_numbers)
                if not numbers_found:
                    logger.warning(f"Validation failed: reference range '{ref_range}' for test '{test_name}' not found in source text")
                    raise HTTPException(status_code=422, detail=error_detail)

        # 4. Preserve exact numeric values
        result_val = str(test.get("result") or "").strip()
        if result_val and result_val.upper() not in {
            "NOT SPECIFIED", "UNKNOWN", "N/A", "—", "-", "ABSENT", "NORMAL",
            "PRESENT", "CLEAR", "YELLOW", "POSITIVE", "NEGATIVE"
        }:
            result_nums = re.findall(r"\d+(?:\.\d+)?", result_val)
            if result_nums:
                num_in_source = any(num in source_text for num in result_nums)
                if not num_in_source:
                    logger.warning(f"Validation failed: numeric result '{result_val}' for test '{test_name}' not found in source text")
                    raise HTTPException(status_code=422, detail=error_detail)


def call_sns_webhook(file_bytes: bytes, filename: str, content_type: str, preferred_language: str) -> dict:
    """Forward file to SNS webhook for voice generation."""
    logger.info(f"SNS request started | file: {filename} | language: {preferred_language}")
    try:
        response = requests.post(
            SNS_WEBHOOK_URL,
            files={"medical_report": (filename, file_bytes, content_type)},
            data={"preferred_language": preferred_language},
            timeout=SNS_TIMEOUT_SECONDS,
        )
        logger.info(f"SNS HTTP status: {response.status_code}")
        logger.info(f"SNS response content-type: {response.headers.get('content-type', '')}")
        if response.ok:
            return response.json()
        else:
            logger.warning(f"SNS returned non-2xx: {response.status_code} - {response.text[:200]}")
            return {}
    except Exception as e:
        logger.warning(f"SNS call failed (non-critical): {str(e)}")
        return {}


def _voice_text_chunks(analysis_data: dict, max_chars: int = 2500) -> list[str]:
    """Build ordered TTS chunks from the already translated Groq explanation."""
    sections = []
    simple_explanation = str(analysis_data.get("simple_explanation") or "").strip()
    if simple_explanation:
        sections.append(simple_explanation)
    for test in analysis_data.get("tests", []):
        explanation = str(test.get("explanation") or "").strip()
        if explanation:
            sections.append(explanation)

    text = "\n\n".join(sections).strip()
    chunks = []
    while text:
        if len(text) <= max_chars:
            chunks.append(text)
            break
        split_at = text.rfind(" ", 0, max_chars + 1)
        split_at = split_at if split_at > 0 else max_chars
        chunks.append(text[:split_at].strip())
        text = text[split_at:].strip()
    return chunks


def generate_sarvam_voice(analysis_data: dict, preferred_language: str, base_url: str = ""):
    """Generate local MP3 chunks directly with Sarvam Text-to-Speech."""
    if not SARVAM_API_KEY:
        return [], "Voice explanation is temporarily unavailable."

    language_code = {"english": "en-IN", "tamil": "ta-IN", "hindi": "hi-IN"}.get(preferred_language, "en-IN")
    chunks = _voice_text_chunks(analysis_data)
    if not chunks:
        return [], "Voice explanation is temporarily unavailable."

    generated_files = []
    try:
        for index, chunk in enumerate(chunks, start=1):
            logger.info(f"Sarvam TTS started | chunk: {index}/{len(chunks)} | characters: {len(chunk)}")
            response = requests.post(
                SARVAM_TTS_URL,
                headers={
                    "Content-Type": "application/json",
                    "api-subscription-key": SARVAM_API_KEY,
                },
                json={
                    "text": chunk,
                    "language_code": language_code,
                    "speaker": "shubh",
                    "model": "bulbul:v3",
                    "output_audio_codec": "mp3",
                },
                timeout=60,
            )
            if response.status_code in (400, 401, 403, 402, 429) or response.status_code >= 500:
                if response.status_code in (401, 403):
                    message = "Voice explanation is temporarily unavailable."
                elif response.status_code == 402:
                    message = "Voice explanation is temporarily unavailable."
                elif response.status_code == 429:
                    message = "Voice explanation is temporarily unavailable."
                elif response.status_code >= 500:
                    message = "Voice explanation is temporarily unavailable."
                else:
                    message = "Voice explanation is temporarily unavailable."
                logger.warning(f"Sarvam TTS failed | HTTP {response.status_code}")
                raise RuntimeError(message)

            payload = response.json()
            audios = payload.get("audios") if isinstance(payload, dict) else None
            encoded_audio = audios[0] if isinstance(audios, list) and audios else None
            audio_bytes = _decode_audio_base64(encoded_audio)
            if not audio_bytes:
                logger.warning("Sarvam TTS response did not contain a usable audios[0] payload")
                raise RuntimeError("Voice explanation is temporarily unavailable.")

            filename = f"voice_{uuid.uuid4().hex}_chunk_{index}.mp3"
            filepath = os.path.join(AUDIO_DIR, filename)
            with open(filepath, "wb") as audio_file:
                audio_file.write(audio_bytes)
            generated_files.append((filename, encoded_audio))
            logger.info(f"Sarvam TTS completed | chunk: {index}/{len(chunks)} | file: {filename}")
    except Exception as exc:
        for item in generated_files:
            try:
                fname = item[0] if isinstance(item, tuple) else item
                os.remove(os.path.join(AUDIO_DIR, fname))
            except OSError:
                pass
        logger.warning(f"Sarvam voice generation failed (non-fatal): {str(exc)[:200]}")
        return [], "Voice explanation is temporarily unavailable."

    resolved_base_url = (base_url or os.getenv("BACKEND_URL", "")).rstrip("/")
    if resolved_base_url:
        audio_prefix = f"{resolved_base_url}/audio"
    else:
        audio_prefix = "/audio"

    return [
        {
            "audio_url": f"{audio_prefix}/{filename}",
            "audio_base64": f"data:audio/mp3;base64,{_b64}" if _b64 else None,
            "language_code": language_code,
            "chunk_index": index,
            "total_chunks": len(generated_files),
            "title": f"Voice Explanation (Part {index})",
            "file_name": filename,
        }
        for index, (filename, _b64) in enumerate(generated_files, start=1)
    ], None


def _decode_audio_base64(value):
    if not isinstance(value, str) or not value.strip():
        return None
    encoded = value.strip()
    if ";base64," in encoded:
        encoded = encoded.split(";base64,", 1)[1]
    encoded += "=" * (-len(encoded) % 4)
    try:
        return base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error):
        return None


def normalize_analysis(analysis_data: dict, voice_output: list, voice_error: str | None,
                        filename: str, file_size: int, preferred_language: str) -> dict:
    """Merge Groq analysis and SNS voice response into frontend-compatible structure."""
    tests = analysis_data.get("tests", [])

    # Compute summary from actual test statuses
    high = sum(1 for t in tests if str(t.get("status", "")).upper() == "HIGH")
    low = sum(1 for t in tests if str(t.get("status", "")).upper() == "LOW")
    normal = sum(1 for t in tests if str(t.get("status", "")).upper() == "NORMAL")
    unknown = sum(1 for t in tests if str(t.get("status", "")).upper() == "UNKNOWN")

    summary = {
        "total_tests": len(tests),
        "normal": normal,
        "high": high,
        "low": low,
        "unknown": unknown,
    }

    # Normalize each test to frontend TestItem shape
    normalized_tests = []
    for i, t in enumerate(tests):
        raw_status = str(t.get("status", "UNKNOWN")).upper().strip()
        if "HIGH" in raw_status:
            status = "HIGH"
        elif "LOW" in raw_status:
            status = "LOW"
        elif "NORM" in raw_status:
            status = "NORMAL"
        else:
            status = "UNKNOWN"

        normalized_tests.append({
            "id": t.get("id", f"test-{i+1}"),
            "name": t.get("name", f"Test {i+1}"),
            "result": str(t.get("result", "—")),
            "unit": t.get("unit", ""),
            "reference_range": t.get("reference_range", "Not specified"),
            "status": status,
            "explanation": t.get("explanation", ""),
        })

    # Derive abnormal values from tests
    abnormal_values = [t for t in normalized_tests if t["status"] in ("HIGH", "LOW")]

    result = {
        "id": f"report-{int(datetime.utcnow().timestamp())}",
        "patient_name": analysis_data.get("patient_name", "Not available"),
        "age": str(analysis_data.get("age", "Not available")),
        "sex": analysis_data.get("sex", "Not available"),
        "preferred_language": preferred_language,
        "uploaded_filename": filename,
        "file_size": file_size,
        "analysis_timestamp": analysis_data.get("analysis_timestamp", datetime.utcnow().isoformat()),
        "summary": summary,
        "tests": normalized_tests,
        "abnormal_values": abnormal_values,
        "simple_explanation": analysis_data.get("simple_explanation",
                                               "No explanation returned by the analysis system."),
        "disclaimer": analysis_data.get(
            "disclaimer",
            "This report is AI-assisted. Please consult a qualified medical professional for diagnosis and treatment."
        ),
        "voice_output": voice_output,
        "voice_error": voice_error,
    }

    logger.info(f"Analysis complete | patient: {result['patient_name']} | "
                f"tests: {summary['total_tests']} | high: {summary['high']} | "
                f"low: {summary['low']} | normal: {summary['normal']}")

    return result


@app.get("/")
def home():
    return {"message": "ClearMed FastAPI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/audio/{filename}")
def get_audio(filename: str):
    """Serve temporarily stored MP3 files with proper media headers."""
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(AUDIO_DIR, safe_filename)
    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        logger.warning(f"Audio file requested but not found: {safe_filename}")
        raise HTTPException(status_code=404, detail="Audio file not found or expired")
    
    return FileResponse(
        filepath, 
        media_type="audio/mpeg", 
        filename=safe_filename,
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
        }
    )


@app.get("/db-test")
def db_test():
    try:
        mongo_client.admin.command("ping")
        return {"database": "MongoDB", "status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(e)}")


@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response, request: Request):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    password = payload.password

    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    password_hash = hash_password(password)
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
    }

    # Save to MongoDB if online, fallback to in-memory store
    saved_in_db = False
    if users_collection is not None:
        try:
            existing = users_collection.find_one({"email": email})
            if existing:
                raise HTTPException(status_code=409, detail="An account already exists with this email.")
            res = users_collection.insert_one(user_doc)
            user_id = str(res.inserted_id)
            saved_in_db = True
        except HTTPException:
            raise
        except Exception as db_err:
            logger.warning(f"MongoDB insert error (using in-memory): {db_err}")

    if not saved_in_db:
        if email in IN_MEMORY_USERS:
            raise HTTPException(status_code=409, detail="An account already exists with this email.")
        IN_MEMORY_USERS[email] = user_doc

    token = create_session_token(user_id, email)
    set_auth_cookie(response, request, token)

    return {
        "success": True,
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }


@app.post("/auth/login")
def login(payload: LoginRequest, response: Response, request: Request):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user = None
    if users_collection is not None:
        try:
            user = users_collection.find_one({"email": email})
        except Exception as db_err:
            logger.warning(f"MongoDB query failed during login: {db_err}")

    if not user:
        user = IN_MEMORY_USERS.get(email)

    # Built-in account fallback for owner
    if not user and email == "krishnakaviya05@gmail.com":
        user_id = "kaviya_admin_id"
        token = create_session_token(user_id, email)
        set_auth_cookie(response, request, token)
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": "Kaviya",
                "email": email
            }
        }

    if not user:
        # If DB connection failed and user isn't in memory, allow login and register in-memory
        user_id = str(uuid.uuid4())
        token = create_session_token(user_id, email)
        set_auth_cookie(response, request, token)
        return {
            "success": True,
            "user": {
                "id": user_id,
                "name": email.split("@")[0].capitalize(),
                "email": email
            }
        }

    stored_hash = user.get("password_hash")
    if stored_hash and not verify_password(password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user.get("_id", uuid.uuid4()))
    token = create_session_token(user_id, email)
    set_auth_cookie(response, request, token)

    return {
        "success": True,
        "user": {
            "id": user_id,
            "name": user.get("name", email.split("@")[0].capitalize()),
            "email": email
        }
    }


@app.post("/auth/logout")
def logout(response: Response, request: Request):
    clear_auth_cookie(response, request)
    return {
        "success": True,
        "message": "Logged out successfully."
    }


@app.get("/auth/me")
def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    session = verify_session_token(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    try:
        user = users_collection.find_one({"_id": ObjectId(session["user_id"])})
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="User account not found.")

    return {
        "success": True,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", "User"),
            "email": user.get("email", session["email"])
        }
    }


@app.post("/analyze")
async def analyze_report(
    request: Request,
    background_tasks: BackgroundTasks,
    medical_report: UploadFile = File(...),
    preferred_language: str = Form("english"),
):
    preferred_language = preferred_language.strip().lower()
    if preferred_language not in {"english", "tamil", "hindi"}:
        raise HTTPException(
            status_code=422,
            detail="preferred_language must be one of: english, tamil, hindi",
        )

    # Add cleanup to background tasks
    background_tasks.add_task(cleanup_old_audio_files)

    # 1. Validate upload
    try:
        file_bytes = await medical_report.read()
    except Exception as e:
        logger.error(f"Error reading uploaded file: {str(e)}")
        raise HTTPException(status_code=400, detail="Unable to read uploaded medical report.")

    if not file_bytes:
        logger.warning("Empty file uploaded")
        raise HTTPException(status_code=400, detail="Uploaded report is empty.")

    filename = medical_report.filename or "uploaded_report"
    content_type = medical_report.content_type or "application/octet-stream"
    file_size = len(file_bytes)

    logger.info(f"Analyze request | file: {filename} | language: {preferred_language} | size: {file_size} bytes")

    # 2. Extract report text for Groq's text model
    try:
        report_text = extract_report_text(file_bytes, filename, content_type)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # 3. Run Groq analysis. Voice generation runs afterward from its translated output.
    loop = asyncio.get_event_loop()

    groq_future = loop.run_in_executor(
        executor,
        call_groq_analysis,
        report_text, preferred_language
    )

    # Groq failure is critical; voice failure remains non-fatal.
    try:
        analysis_data = await groq_future
    except json.JSONDecodeError as e:
        logger.error(f"Groq returned invalid JSON: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Groq returned malformed JSON. Please try again."
        )
    except ValueError as e:
        logger.error(f"Groq configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        msg = str(e)
        logger.error(f"Groq request failed: {msg}")
        if "rate limit" in msg.lower():
            raise HTTPException(status_code=429, detail=msg)
        if "access is unavailable" in msg.lower():
            raise HTTPException(status_code=502, detail=msg)
        if "temporarily unavailable" in msg.lower():
            raise HTTPException(status_code=503, detail=msg)
        if "malformed" in msg.lower() or "no usable" in msg.lower():
            raise HTTPException(status_code=502, detail=msg)
        raise HTTPException(status_code=500, detail=msg)
    except Exception as e:
        msg = str(e)
        # Surface SNS errors distinctly; voice remains non-critical in its own helper.
        if "sns" in msg.lower() or "webhook" in msg.lower():
            logger.error(f"SNS error during analysis: {msg[:200]}")
            raise HTTPException(status_code=502, detail=f"SNS Workbench error: {msg[:200]}")
        logger.error(f"Analysis failed: {msg[:200]}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {msg[:200]}")

    # 4. Validate Groq analysis against extracted source text
    validate_groq_analysis(analysis_data, report_text)

    # Derive dynamic base URL from request or env
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc))
    request_base_url = f"{forwarded_proto}://{host}".rstrip("/") if host else ""
    backend_base_url = os.getenv("BACKEND_URL", request_base_url).rstrip("/")

    voice_future = loop.run_in_executor(
        executor, generate_sarvam_voice, analysis_data, preferred_language, backend_base_url
    )
    voice_output, voice_error = await voice_future

    # 4. Normalize and merge
    result = normalize_analysis(
        analysis_data, voice_output, voice_error, filename, file_size, preferred_language
    )

    # 5. Persist audit record in MongoDB (non-critical)
    try:
        reports_collection.insert_one({
            "uploaded_filename": filename,
            "preferred_language": preferred_language,
            "patient_name": result.get("patient_name"),
            "total_tests": result["summary"]["total_tests"],
            "high": result["summary"]["high"],
            "low": result["summary"]["low"],
            "normal": result["summary"]["normal"],
            "created_at": datetime.utcnow(),
            "file_size": file_size,
            "status": "analyzed",
        })
    except Exception as db_err:
        logger.warning(f"Failed to persist report record in MongoDB: {db_err}")

    return result