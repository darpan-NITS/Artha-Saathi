from fastapi import APIRouter, Request, Form
from fastapi.responses import PlainTextResponse
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
import os
import re

router = APIRouter()

# Short commands for WhatsApp UX
COMMANDS = {
    "score":  "Give me my money health score",
    "retire": "How long until I can retire?",
    "tax":    "Which tax regime is better for me?",
    "shock":  "Show my financial future projection",
    "help":   None,  # handled separately
}

def format_for_whatsapp(text: str) -> str:
    """
    Convert markdown-style AI response to WhatsApp-friendly format.
    WhatsApp supports *bold*, _italic_, ~strikethrough~ but not ## headers.
    Max 1600 chars per message.
    """
    # Convert **bold** to *bold* (WhatsApp style)
    text = re.sub(r'\*\*(.*?)\*\*', r'*\1*', text)
    # Remove markdown headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove SEBI registration placeholder if it snuck in
    text = re.sub(r'SEBI Registration No\. \[.*?\]', '', text)
    text = re.sub(r'Built by.*?Hackathon \d+\.', '', text)
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    # Truncate if too long
    if len(text) > 1500:
        text = text[:1497] + "..."
    return text


def get_or_create_wa_session(phone_number: str) -> str:
    """
    Map WhatsApp phone number to an Artha-Saathi session ID.
    Stored in SQLite so conversations persist across messages.
    """
    from agents.base import get_db, init_db
    from datetime import datetime
    import json

    init_db()
    conn = get_db()

    # Use phone number as a stable session key
    safe_key = phone_number.replace("+", "").replace(":", "")
    session_id = f"wa_{safe_key}"

    row = conn.execute(
        "SELECT session_id FROM user_sessions WHERE session_id = ?",
        (session_id,)
    ).fetchone()

    if not row:
        conn.execute("""
            INSERT INTO user_sessions
            (session_id, profile_data, conversation_history, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, "{}", "[]",
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()

    conn.close()
    return session_id


@router.post("/whatsapp", response_class=PlainTextResponse)
async def whatsapp_webhook(
    request: Request,
    Body: str = Form(...),
    From: str = Form(...),
):
    """
    Twilio sends a POST to this endpoint for every incoming WhatsApp message.
    We process it through Artha-Saathi agents and reply via TwiML.
    """
    from agents.orchestrator import process_message

    user_message = Body.strip()
    phone_number = From  # e.g. "whatsapp:+919876543210"

    # Get or create persistent session for this phone number
    session_id = get_or_create_wa_session(phone_number)

    # Handle help command
    if user_message.lower() == "help":
        help_text = (
            "*Artha-Saathi Commands* 🪙\n\n"
            "Just chat naturally, or use shortcuts:\n\n"
            "*score* — Money Health Score\n"
            "*retire* — FIRE retirement plan\n"
            "*tax* — Tax regime comparison\n"
            "*shock* — 5-year financial projection\n"
            "*help* — Show this menu\n\n"
            "Or just tell me: _I earn ₹60,000/month and spend ₹40,000_"
        )
        resp = MessagingResponse()
        resp.message(help_text)
        return PlainTextResponse(str(resp), media_type="text/xml")

    # Expand short commands to full messages
    if user_message.lower() in COMMANDS and COMMANDS[user_message.lower()]:
        user_message = COMMANDS[user_message.lower()]

    # Process through Artha-Saathi multi-agent pipeline
    try:
        result = process_message(user_message, session_id)
        raw_response = result.get("response", "Sorry, something went wrong.")
        formatted = format_for_whatsapp(raw_response)

        # Append feature hint if calculations were run
        feature = result.get("feature", "general")
        if feature in ("health_score", "fire", "tax") and result.get("calculations"):
            formatted += "\n\n_Visit artha-saathi.vercel.app for full charts & visuals_"

    except Exception as e:
        formatted = (
            "Sorry, I ran into an issue. Please try again.\n"
            "Type *help* to see available commands."
        )

    resp = MessagingResponse()
    resp.message(formatted)
    return PlainTextResponse(str(resp), media_type="text/xml")
