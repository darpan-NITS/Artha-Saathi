from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
# Verify key loads correctly
print("API Key loaded:", os.getenv("ANTHROPIC_API_KEY")[:10], "...")

app = FastAPI(title="Artha-Saathi", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "project": "Artha-Saathi"}
