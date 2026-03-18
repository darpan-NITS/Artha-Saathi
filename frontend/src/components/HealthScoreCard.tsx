"use client"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from "recharts"
import { HealthScore } from "@/types"

interface Props {
  score: HealthScore
}

const LABELS: Record<string, string> = {
  emergency_fund: "Emergency Fund",
  insurance: "Insurance",
  investment_diversification: "Investments",
  debt_health: "Debt Health",
  tax_efficiency: "Tax",
  retirement_readiness: "Retirement",
}

export default function HealthScoreCard({ score }: Props) {
  const data = Object.entries(score.dimension_scores).map(([key, value]) => ({
    subject: LABELS[key] || key,
    score: value,
    fullMark: 100,
  }))

  const gradeColor = {
    A: "text-emerald-600",
    B: "text-blue-600",
    C: "text-amber-600",
    D: "text-red-600",
  }[score.grade] || "text-gray-600"

  const scoreBg = {
    A: "bg-emerald-50 border-emerald-200",
    B: "bg-blue-50 border-blue-200",
    C: "bg-amber-50 border-amber-200",
    D: "bg-red-50 border-red-200",
  }[score.grade] || "bg-gray-50 border-gray-200"

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Money Health Score
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold text-gray-800">
              {score.overall_score}
            </span>
            <span className="text-gray-400 text-sm">/100</span>
            <span className={`text-2xl font-bold ${gradeColor}`}>
              {score.grade}
            </span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-sm font-medium ${scoreBg} ${gradeColor}`}>
          {score.interpretation.split(".")[0]}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#f0f0f0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: number) => [`${value}/100`, "Score"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension bars */}
      <div className="mt-4 space-y-2">
        {Object.entries(score.dimension_scores).map(([key, value]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-28 shrink-0">
              {LABELS[key]}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  value >= 70
                    ? "bg-emerald-500"
                    : value >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-8 text-right">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}