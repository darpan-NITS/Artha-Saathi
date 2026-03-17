from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")
if api_key:
    print("API Key loaded:", api_key[:10], "...")
else:
    print("WARNING: ANTHROPIC_API_KEY not found in .env")

app = FastAPI(title="Artha-Saathi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "project": "Artha-Saathi"}