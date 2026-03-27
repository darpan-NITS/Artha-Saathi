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
    try:
        audio_bytes = await audio.read()

        # Reject audio under 10KB — too short, causes hallucinations
        if len(audio_bytes) < 10000:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Audio too short. Please speak for at least 2 seconds.",
                    "success": False
                }
            )

        transcription = client.audio.transcriptions.create(
            file=(audio.filename or "recording.webm", audio_bytes),
            model="whisper-large-v3",
            response_format="verbose_json",  # returns object, not string
            prompt="The user is speaking in English or Hindi about personal finance, income, expenses, investments, tax, SIP, mutual funds."
        )

        # Extract text from response object
        text = transcription.text if hasattr(transcription, "text") else str(transcription)

        return {"text": text, "success": True}

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "success": False}
        )
