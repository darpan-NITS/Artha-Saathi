const BASE_URL = "http://localhost:8000/api"

export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<any> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!res.ok) throw new Error("Chat request failed")
  return res.json()
}

export async function getHealthScore(sessionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/health-score/${sessionId}`)
  if (!res.ok) throw new Error("Health score fetch failed")
  return res.json()
}

export async function getAgentTraces(sessionId: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/traces/${sessionId}`)
  if (!res.ok) return []
  return res.json()
}