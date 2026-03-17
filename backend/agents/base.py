import os
import json
import sqlite3
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_db():
    conn = sqlite3.connect("artha_saathi.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_traces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            agent_name TEXT,
            input_summary TEXT,
            output_summary TEXT,
            reasoning TEXT,
            timestamp TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            session_id TEXT PRIMARY KEY,
            profile_data TEXT,
            conversation_history TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def log_trace(session_id: str, agent_name: str, input_summary: str,
              output_summary: str, reasoning: str):
    conn = get_db()
    conn.execute("""
        INSERT INTO agent_traces
        (session_id, agent_name, input_summary, output_summary, reasoning, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, agent_name, input_summary, output_summary,
          reasoning, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def call_claude(system_prompt: str, user_message: str,
                max_tokens: int = 1000) -> str:
    """Calls Groq (drop-in replacement for Claude calls)."""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    )
    return response.choices[0].message.content

def call_claude_json(system_prompt: str, user_message: str,
                     max_tokens: int = 1000) -> dict:
    """Calls Groq and parses response as JSON."""
    system_with_json = system_prompt + "\n\nCRITICAL: Respond ONLY with valid JSON. No preamble, no explanation, no markdown backticks."
    raw = call_claude(system_with_json, user_message, max_tokens)
    clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(clean)