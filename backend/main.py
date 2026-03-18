from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from agents.base import init_db
from routes.health_score import router as health_score_router
app.include_router(health_score_router, prefix="/api")

app = FastAPI(title="Artha-Saathi API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(chat_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "project": "Artha-Saathi"}
