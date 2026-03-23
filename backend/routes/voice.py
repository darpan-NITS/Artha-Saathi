from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/voice-to-text")
async def voice_to_text(audio: UploadFile = File(...)):
    """
    Receives audio blob from frontend mic,
    transcribes via Groq Whisper, returns text.
    Supports Hindi and English automatically.
    """
    try:
        audio_bytes = await audio.read()
        
        transcription = client.audio.transcriptions.create(
            file=(audio.filename or "audio.webm", audio_bytes),
            model="whisper-large-v3",
            language=None,  # auto-detect Hindi or English
            response_format="text"
        )
        
        return {"text": transcription, "success": True}
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "success": False}
        )
