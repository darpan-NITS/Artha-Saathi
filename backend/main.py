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
import asyncio
import httpx
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# The deployed Render URL — used for the self-ping keep-alive
BACKEND_URL = os.getenv("BACKEND_URL", "https://artha-saathi.onrender.com")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB at startup
    init_db()

    async def keep_alive():
        """
        Pings this server's /ping endpoint every 14 minutes (840s)
        to prevent Render's free tier from spinning it down.
        Render spins down after 15 min of inactivity, so 14 min is safe.
        """
        await asyncio.sleep(30)  # brief startup delay before first ping
        while True:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.get(f"{BACKEND_URL}/ping")
                    logger.info(f"Keep-alive ping → {resp.status_code}")
            except Exception as e:
                logger.warning(f"Keep-alive ping failed: {e}")
            await asyncio.sleep(840)  # wait 14 minutes before next ping

    asyncio.create_task(keep_alive())

    yield

app = FastAPI(
    title="Artha-Saathi API",
    version="0.3.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://artha-saathi.vercel.app",
    ],
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
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

@app.get("/ping")
def ping():
    return "ok"
