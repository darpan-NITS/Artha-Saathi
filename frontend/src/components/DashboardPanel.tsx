"use client"
import { useState, useEffect } from "react"
import HealthScoreCard from "./HealthScoreCard"
import AgentTrace from "./AgentTrace"
import FirePlanner from "./FirePlanner"
import { getHealthScore, getAgentTraces } from "@/lib/api"
import { HealthScore, AgentTrace as AgentTraceType } from "@/types"

interface Props {
  sessionId: string | null
  profileSnapshot: Record<string, any>
  calculations: Record<string, any>
  messageCount: number
}

export default function DashboardPanel({
  sessionId, profileSnapshot, calculations, messageCount
}: Props) {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [traces, setTraces] = useState<AgentTraceType[]>([])
  const [showTraces, setShowTraces] = useState(false)
  const [activeTab, setActiveTab] = useState<"health" | "fire">("health")

  useEffect(() => {
    if (!sessionId) return
    getHealthScore(sessionId).then((data) => {
      if (data.score) setHealthScore(data.score)
    })
    getAgentTraces(sessionId).then(setTraces)
  }, [sessionId, messageCount])

  const formatValue = (key: string, value: any) => {
    const moneyKeys = ["income", "expense", "saving", "fund", "investment",
                       "debt", "emi", "cover", "corpus", "salary"]
    if (typeof value === "number" &&
        moneyKeys.some((k) => key.toLowerCase().includes(k))) {
      return `₹${value.toLocaleString("en-IN")}`
    }
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
  }

  const profileFields = Object.entries(profileSnapshot).filter(
    ([_, v]) => v !== null && v !== undefined
  )

  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("health")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTab === "health"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Health Score
          </button>
          <button
            onClick={() => setActiveTab("fire")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTab === "fire"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            FIRE Planner
          </button>
        </div>
        {sessionId && (
          <button
            onClick={() => setShowTraces(!showTraces)}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1 rounded-lg"
          >
            {showTraces ? "Hide" : "Show"} Trace
          </button>
        )}
      </div>

      {/* Health Score Tab */}
      {activeTab === "health" && (
        <>
          {healthScore ? (
            <HealthScoreCard score={healthScore} />
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-gray-500">
                Tell Artha-Saathi your income, expenses, and age to see
                your Money Health Score
              </p>
            </div>
          )}

          {profileFields.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                Your Profile
              </p>
              <div className="grid grid-cols-2 gap-2">
                {profileFields.map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-gray-400 capitalize">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {formatValue(key, value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(calculations).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
                Live Calculations
              </p>
              <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-3 rounded-xl">
                {JSON.stringify(calculations, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {/* FIRE Tab */}
      {activeTab === "fire" && sessionId && (
        <FirePlanner sessionId={sessionId} />
      )}
      {activeTab === "fire" && !sessionId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-700 text-center">
          Start a conversation first to generate your FIRE plan
        </div>
      )}

      {/* Agent Trace */}
      {showTraces && traces.length > 0 && (
        <AgentTrace traces={traces} />
      )}
    </div>
  )
}
