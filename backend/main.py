from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from routes.health_score import router as health_score_router
from agents.base import init_db
from routes.fire import router as fire_router
from routes.tax import router as tax_router
from routes.future_shock import router as future_shock_router
from routes.whatsapp import router as whatsapp_router
from routes.voice import router as voice_router

app = FastAPI(title="Artha-Saathi API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
app.include_router(chat_router, prefix="/api")
app.include_router(health_score_router, prefix="/api")
app.include_router(fire_router, prefix="/api")
app.include_router(tax_router, prefix="/api")
app.include_router(future_shock_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api")
app.include_router(voice_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Artha-Saathi API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "project": "Artha-Saathi"}
