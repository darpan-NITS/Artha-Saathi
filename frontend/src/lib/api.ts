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

export async function getFirePlan(sessionId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/fire/${sessionId}`)
  if (!res.ok) throw new Error("FIRE plan fetch failed")
  return res.json()
}

export async function getFireScenario(
  sessionId: string,
  monthlySip: number,
  annualReturn: number
): Promise<any> {
  const res = await fetch(`${BASE_URL}/fire/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      override_monthly_sip: monthlySip,
      override_annual_return: annualReturn,
    }),
  })
  if (!res.ok) throw new Error("Scenario fetch failed")
  return res.json()
}
