"""
app.py
------
FastAPI microservice that exposes transcription_core.py over HTTP so the
existing Node/Express backend (or anything else) can call it.

Run it with:
    uvicorn app:app --host 0.0.0.0 --port 8001

Endpoints:
    GET  /health
    POST /transcribe
         multipart/form-data:
           - audio       (file, optional) - .mp3/.wav/.m4a/.ogg/.webm...
           - document    (file, optional) - .pdf/.png/.jpg/.jpeg
           - language    (form field, optional) - force audio language, e.g. "hi"
           - ocr_lang    (form field, optional) - default "eng+hin"

         At least one of "audio" / "document" is required.

Response JSON:
    {
      "success": true,
      "data": {
        "audio_transcript": { "text": "...", "language": "hi", ... } | null,
        "document_transcript": { "text": "...", "pages": [...] } | null
      }
    }
"""

import os
import shutil
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from transcription_core import process_inputs, get_whisper_model

app = FastAPI(title="Transcription Service", version="1.0.0")


@app.on_event("startup")
def _warm_up_model():
    # Load the Whisper model once at startup instead of on the first
    # request, so the first real request isn't slow.
    get_whisper_model()


@app.get("/health")
def health():
    return {"success": True, "status": "ok"}


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(default=None),
    document: UploadFile = File(default=None),
    language: str = Form(default=None),
    ocr_lang: str = Form(default="eng+hin"),
):
    if audio is None and document is None:
        raise HTTPException(status_code=400, detail="Provide at least one of 'audio' or 'document'")

    tmp_dir = tempfile.mkdtemp(prefix="transcribe_")
    audio_path = None
    document_path = None

    try:
        if audio is not None:
            audio_path = os.path.join(tmp_dir, audio.filename)
            with open(audio_path, "wb") as f:
                shutil.copyfileobj(audio.file, f)

        if document is not None:
            document_path = os.path.join(tmp_dir, document.filename)
            with open(document_path, "wb") as f:
                shutil.copyfileobj(document.file, f)

        result = process_inputs(
            audio_path=audio_path,
            document_path=document_path,
            audio_language=language,
            ocr_lang=ocr_lang,
        )
        return JSONResponse({"success": True, "data": result})

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
