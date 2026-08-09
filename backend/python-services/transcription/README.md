# Transcription Service (Audio + PDF/Image -> Text)

A small, free, fully-local Python microservice that adds speech-to-text
(with local/regional language support) and PDF/image-to-text (OCR) to the
project. It does not use any paid API.

## Where this lives in the project

Put this whole folder at:

```
AI_Enabled_Health_system-main/
  backend/
    python-services/
      transcription/        <-- this folder
        app.py
        transcription_core.py
        requirements.txt
        README.md
  frontend/
```

It runs as its own small process alongside the existing Node/Express
backend (Node has no good free local speech-to-text library — Python's
open-source ecosystem does, so we call it from Node over HTTP).

## 1. System dependencies (one-time setup)

These are free, open-source system packages:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg tesseract-ocr poppler-utils

# Add language packs for OCR as needed, e.g. Hindi, Tamil, Telugu, Bengali:
sudo apt-get install -y tesseract-ocr-hin tesseract-ocr-tam tesseract-ocr-tel tesseract-ocr-ben
```

- `ffmpeg` -> lets Whisper read mp3/m4a/ogg/webm etc.
- `tesseract-ocr` -> OCR engine used for images and scanned PDF pages.
- `poppler-utils` -> lets `pdf2image` rasterise PDF pages for OCR.

macOS: `brew install ffmpeg tesseract poppler` (add language packs via
`brew install tesseract-lang`).
Windows: install the Tesseract installer from the UB-Mannheim build and
add its folder to PATH (or set `TESSERACT_CMD` env var).

## 2. Python setup

```bash
cd backend/python-services/transcription
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Run it

```bash
uvicorn app:app --host 0.0.0.0 --port 8001
```

Test it:

```bash
curl -X POST http://localhost:8001/transcribe \
  -F "audio=@sample_hindi_audio.mp3" \
  -F "document=@prescription.pdf"
```

Or run without the API, straight from the command line:

```bash
python transcription_core.py --audio note.mp3 --document report.pdf
```

## Language support

- **Audio**: Whisper auto-detects the spoken language by default (works
  for Hindi, Tamil, Telugu, Bengali, Marathi, Punjabi, Gujarati, Urdu,
  English, and ~90 others). To force a language, pass `language=hi` (etc.)
  as a form field / function argument.
- **OCR (PDF/image)**: controlled by `ocr_lang` (Tesseract language codes,
  default `"eng+hin"`). Add more language packs via apt/brew and pass
  e.g. `"eng+hin+tam"`.

## Environment variables (optional)

| Variable              | Default | Purpose                                   |
|-----------------------|---------|--------------------------------------------|
| WHISPER_MODEL_SIZE    | small   | tiny/base/small/medium/large-v3            |
| WHISPER_DEVICE        | cpu     | cpu or cuda                                |
| WHISPER_COMPUTE_TYPE  | int8    | int8 (CPU) / float16 (GPU)                 |
| OCR_LANGUAGES         | eng+hin | default Tesseract language string          |
| TESSERACT_CMD         | (unset) | explicit path to tesseract binary          |

Bigger Whisper models = better accuracy on regional languages but slower
on CPU. `small` is a reasonable free default; use `medium` if you have
decent CPU/RAM or a GPU.

## How the Node backend calls this service

See `backend/src/modules/transcription/` for a ready-made proxy module
that adds a `POST /api/transcription` route to the existing Express API,
forwarding uploaded audio/document files to this service and returning
its JSON response. Add `TRANSCRIPTION_SERVICE_URL=http://localhost:8001`
to `backend/.env`.
