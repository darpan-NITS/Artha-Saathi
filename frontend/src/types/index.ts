export interface Message {
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }
  
  export interface DimensionScores {
    emergency_fund: number
    insurance: number
    investment_diversification: number
    debt_health: number
    tax_efficiency: number
    retirement_readiness: number
  }
  
  export interface HealthScore {
    overall_score: number
    grade: string
    dimension_scores: DimensionScores
    interpretation: string
  }
  
  export interface ChatResponse {
    session_id: string
    response: string
    intent: string
    feature: string
    profile_snapshot: Record<string, any>
    calculations: Record<string, any>
    guardrails: {
      is_safe: boolean
      issues: string[]
    }
  }
  
  export interface AgentTrace {
    id: number
    session_id: string
    agent_name: string
    input_summary: string
    output_summary: string
    reasoning: string
    timestamp: string
  }