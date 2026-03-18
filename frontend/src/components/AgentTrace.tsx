"use client"
import { AgentTrace as AgentTraceType } from "@/types"

const AGENT_COLORS: Record<string, string> = {
  Orchestrator: "bg-purple-100 text-purple-700",
  ProfileAgent: "bg-blue-100 text-blue-700",
  CalculatorAgent: "bg-amber-100 text-amber-700",
  AdvisorAgent: "bg-emerald-100 text-emerald-700",
  GuardrailsAgent: "bg-red-100 text-red-700",
}

export default function AgentTrace({ traces }: { traces: AgentTraceType[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
        Agent Audit Trail
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {traces.slice(-10).reverse().map((trace) => (
          <div key={trace.id} className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                AGENT_COLORS[trace.agent_name] || "bg-gray-100 text-gray-600"
              }`}>
                {trace.agent_name}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(trace.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{trace.output_summary}</p>
            {trace.reasoning && (
              <p className="text-xs text-gray-400 mt-0.5 italic">
                {trace.reasoning}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}