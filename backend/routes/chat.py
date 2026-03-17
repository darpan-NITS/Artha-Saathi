from fastapi import APIRouter
from pydantic import BaseModel
from agents.orchestrator import process_message

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

@router.post("/chat")
def chat(request: ChatRequest):
    result = process_message(request.message, request.session_id)
    return result

@router.get("/traces/{session_id}")
def get_traces(session_id: str):
    from agents.base import get_db
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM agent_traces WHERE session_id = ? ORDER BY timestamp",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]