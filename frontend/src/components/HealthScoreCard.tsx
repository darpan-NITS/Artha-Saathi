"use client"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
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

const GRADE_CONFIG = {
  A: {
    bg: "from-emerald-500 to-teal-500",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  B: {
    bg: "from-blue-500 to-indigo-500",
    light: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  C: {
    bg: "from-amber-400 to-orange-500",
    light: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  D: {
    bg: "from-red-500 to-rose-500",
    light: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
} as const

const BAR_COLOR = (v: number) =>
  v >= 70 ? "#059669" : v >= 40 ? "#f59e0b" : "#ef4444"

const RADAR_COLOR = (grade: string) =>
  ({ A: "#059669", B: "#3b82f6", C: "#f59e0b", D: "#ef4444" }[grade] ??
    "#059669")

export default function HealthScoreCard({ score }: Props) {
  const grade = score.grade as keyof typeof GRADE_CONFIG
  const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG.C

  const data = Object.entries(score.dimension_scores).map(([key, value]) => ({
    subject: LABELS[key] ?? key,
    score: Number(value ?? 0),
    fullMark: 100,
  }))

  return (
    <div className="panel-card overflow-hidden">
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${cfg.bg} px-5 pt-5 pb-6`}>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
          Money Health Score
        </p>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold text-white leading-none">
              {Number(score.overall_score ?? 0)}
            </span>
            <span className="text-white/60 text-lg">/100</span>
          </div>

          <div className="text-right">
            <div className="text-5xl font-bold text-white/90 leading-none">
              {score.grade}
            </div>
            <p className="text-white/70 text-xs mt-1">Grade</p>
          </div>
        </div>

        <p className="text-white/80 text-sm mt-3">
          {score.interpretation}
        </p>
      </div>

      <div className="px-5 pb-5 pt-4">
        {/* Radar chart */}
        <div className="h-52 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={data}
              margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
            >
              <PolarGrid stroke="#f0f0f0" />

              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />

              <Radar
                name="Score"
                dataKey="score"
                stroke={RADAR_COLOR(grade)}
                fill={RADAR_COLOR(grade)}
                fillOpacity={0.12}
                strokeWidth={2}
              />

              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #f0f0f0",
                  borderRadius: "10px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
                }}
                formatter={(value: unknown) => {
                  const n = Number(value ?? 0)
                  return [`${n}/100`, "Score"]
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension bars */}
        <div className="space-y-2.5 mt-2">
          {Object.entries(score.dimension_scores).map(([key, value]) => {
            const v = Number(value ?? 0)

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 shrink-0">
                  {LABELS[key]}
                </span>

                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${v}%`,
                      background: BAR_COLOR(v),
                    }}
                  />
                </div>

                <span
                  className="text-xs font-semibold w-8 text-right"
                  style={{ color: BAR_COLOR(v) }}
                >
                  {v}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
