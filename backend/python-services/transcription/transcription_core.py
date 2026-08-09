"""
transcription_core.py
----------------------
Core logic for converting:
  1. Audio (any spoken language) -> text
  2. PDF / image (scanned prescriptions, reports, etc.) -> text

100% free / open-source, runs fully locally (no paid API keys required):
  - Audio  -> faster-whisper (CTranslate2 port of OpenAI Whisper)
              -> multilingual (~99 languages incl. Hindi, Tamil, Telugu,
                 Bengali, Marathi, Punjabi, Urdu, Gujarati, etc.)
              -> auto-detects the spoken language, or it can be forced.
  - Image  -> Tesseract OCR via pytesseract (open source, supports 100+
              language packs, incl. most Indian regional scripts).
  - PDF    -> pdfplumber first (fast, exact text for digitally generated
              PDFs). If a page has no extractable text (i.e. it's a
              scanned/photographed page), it is rasterised with pdf2image
              and OCR'd with Tesseract as a fallback.

This module has NO web-framework dependency, so it can be:
  - imported directly by another Python script,
  - called from the command line, or
  - wrapped by the FastAPI service in app.py (recommended for production,
    since the Whisper model is loaded once and reused across requests).
"""

from __future__ import annotations

import os
import sys
import tempfile
from dataclasses import dataclass, field
from typing import Optional

# --- Audio transcription -----------------------------------------------
from faster_whisper import WhisperModel

# --- Image OCR ------------------------------------------------------------
import pytesseract
from PIL import Image

# --- PDF handling -----------------------------------------------------
import pdfplumber
from pdf2image import convert_from_path


# =========================================================================
# Configuration
# =========================================================================

# Whisper model size. Options (speed vs accuracy trade-off), all free:
#   "tiny", "base", "small", "medium", "large-v3"
# "small" is a good default on CPU; use "medium"/"large-v3" for better
# accuracy on Indian / regional languages if you have a GPU or don't mind
# slower CPU inference.
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")

# "cpu" works everywhere for free. Use "cuda" if you have an NVIDIA GPU.
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")

# "int8" keeps CPU inference fast and memory-light; use "float16" on GPU.
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# Tesseract language codes to load for OCR. "eng+hin" = English + Hindi.
# Combine as many as you need, e.g. "eng+hin+tam+tel+ben+mar+guj+pan+urd".
# Each language needs its .traineddata pack installed on the system
# (see README.md in this folder for install instructions).
OCR_LANGUAGES = os.getenv("OCR_LANGUAGES", "eng+hin")

# If your OS puts the tesseract binary somewhere non-standard (mostly a
# Windows issue), set the path explicitly, e.g.:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
_TESSERACT_CMD = os.getenv("TESSERACT_CMD")
if _TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD


# =========================================================================
# Lazy singleton so the (fairly large) Whisper model is loaded only once,
# no matter how many times transcribe_audio() is called in this process.
# =========================================================================

_whisper_model: Optional[WhisperModel] = None


def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(
            WHISPER_MODEL_SIZE,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
        )
    return _whisper_model


# =========================================================================
# Result containers
# =========================================================================

@dataclass
class AudioTranscriptResult:
    text: str
    language: str
    language_probability: float
    segments: list = field(default_factory=list)  # [{start, end, text}, ...]


@dataclass
class DocumentTranscriptResult:
    text: str
    pages: list = field(default_factory=list)  # per-page text
    used_ocr_pages: list = field(default_factory=list)  # page numbers that needed OCR


# =========================================================================
# 1. Audio -> text
# =========================================================================

def transcribe_audio(
    audio_path: str,
    language: Optional[str] = None,
    task: str = "transcribe",
) -> AudioTranscriptResult:
    """
    Convert an audio file to text.

    Args:
        audio_path: path to the audio file (wav/mp3/m4a/ogg/webm/... -
                     ffmpeg must be installed, see README.md).
        language:   ISO-639-1 code to force a language (e.g. "hi" for Hindi,
                    "ta" for Tamil, "en" for English). Leave as None to let
                    Whisper auto-detect the spoken (local) language.
        task:       "transcribe" (keep original language) or "translate"
                    (always translate speech into English text).

    Returns:
        AudioTranscriptResult
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = get_whisper_model()
    segments, info = model.transcribe(
        audio_path,
        language=language,        # None -> auto-detect local/spoken language
        task=task,
        vad_filter=True,          # trims silence, improves accuracy for free
    )

    segment_list = []
    full_text_parts = []
    for seg in segments:
        segment_list.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
        full_text_parts.append(seg.text.strip())

    return AudioTranscriptResult(
        text=" ".join(full_text_parts).strip(),
        language=info.language,
        language_probability=round(info.language_probability, 3),
        segments=segment_list,
    )


# =========================================================================
# 2. Image -> text (OCR)
# =========================================================================

def extract_text_from_image(image_path: str, lang: str = OCR_LANGUAGES) -> str:
    """OCR a single image file (png/jpg/jpeg/etc.) and return extracted text."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    image = Image.open(image_path)
    text = pytesseract.image_to_string(image, lang=lang)
    return text.strip()


# =========================================================================
# 3. PDF -> text (native text extraction, OCR fallback for scanned pages)
# =========================================================================

def extract_text_from_pdf(pdf_path: str, lang: str = OCR_LANGUAGES) -> DocumentTranscriptResult:
    """
    Extract text from every page of a PDF.

    Digitally-generated pages are read directly (fast, exact). Pages that
    contain no extractable text (i.e. a scanned photo/image of a page) are
    rasterised and OCR'd automatically.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    pages_text: list[str] = []
    used_ocr_pages: list[int] = []

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                pages_text.append(text)
            else:
                # Scanned / image-only page -> fall back to OCR
                pages_text.append(None)  # placeholder, filled below
                used_ocr_pages.append(i)

    if used_ocr_pages:
        # Only rasterise the pages that actually need OCR (keeps it fast)
        images = convert_from_path(pdf_path, dpi=300)
        for page_num in used_ocr_pages:
            img = images[page_num - 1]
            ocr_text = pytesseract.image_to_string(img, lang=lang).strip()
            pages_text[page_num - 1] = ocr_text

    full_text = "\n\n".join(t or "" for t in pages_text).strip()

    return DocumentTranscriptResult(
        text=full_text,
        pages=pages_text,
        used_ocr_pages=used_ocr_pages,
    )


# =========================================================================
# 4. Unified entry point: handles the "audio + optional pdf/image" case
# =========================================================================

def process_inputs(
    audio_path: Optional[str] = None,
    document_path: Optional[str] = None,
    audio_language: Optional[str] = None,
    ocr_lang: str = OCR_LANGUAGES,
) -> dict:
    """
    Main function the rest of the system should call.

    Accepts an audio file and/or a PDF/image document. Returns both
    transcripts in one JSON-serialisable dict, e.g.:

        {
          "audio_transcript": {
              "text": "...",
              "language": "hi",
              "language_probability": 0.98,
              "segments": [...]
          },
          "document_transcript": {
              "text": "...",
              "pages": ["...", "..."],
              "used_ocr_pages": [2]
          }
        }

    If only audio is given, "document_transcript" is None (and vice versa).
    """
    if not audio_path and not document_path:
        raise ValueError("Provide at least one of audio_path or document_path")

    result: dict = {"audio_transcript": None, "document_transcript": None}

    if audio_path:
        audio_result = transcribe_audio(audio_path, language=audio_language)
        result["audio_transcript"] = {
            "text": audio_result.text,
            "language": audio_result.language,
            "language_probability": audio_result.language_probability,
            "segments": audio_result.segments,
        }

    if document_path:
        ext = os.path.splitext(document_path)[1].lower()
        if ext == ".pdf":
            doc_result = extract_text_from_pdf(document_path, lang=ocr_lang)
            result["document_transcript"] = {
                "text": doc_result.text,
                "pages": doc_result.pages,
                "used_ocr_pages": doc_result.used_ocr_pages,
            }
        elif ext in (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"):
            text = extract_text_from_image(document_path, lang=ocr_lang)
            result["document_transcript"] = {
                "text": text,
                "pages": [text],
                "used_ocr_pages": [1],
            }
        else:
            raise ValueError(f"Unsupported document type: {ext} (use .pdf, .png, .jpg, .jpeg)")

    return result


# =========================================================================
# CLI usage (handy for quick local testing without running the API):
#   python transcription_core.py --audio note.mp3 --document report.pdf
# =========================================================================

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Transcribe audio and/or a PDF/image document.")
    parser.add_argument("--audio", help="Path to an audio file")
    parser.add_argument("--document", help="Path to a PDF or image file")
    parser.add_argument("--language", help="Force audio language, e.g. 'hi', 'ta', 'en'", default=None)
    parser.add_argument("--ocr-lang", help="Tesseract language(s), e.g. 'eng+hin'", default=OCR_LANGUAGES)
    args = parser.parse_args()

    output = process_inputs(
        audio_path=args.audio,
        document_path=args.document,
        audio_language=args.language,
        ocr_lang=args.ocr_lang,
    )
    print(json.dumps(output, indent=2, ensure_ascii=False))
