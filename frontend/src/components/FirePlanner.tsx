"use client"
import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import { getFirePlan, getFireScenario } from "@/lib/api"

interface Props {
  sessionId: string
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-50 border-red-200 text-red-700",
  high:   "bg-amber-50 border-amber-200 text-amber-700",
  medium: "bg-blue-50 border-blue-200 text-blue-700",
  goal:   "bg-emerald-50 border-emerald-200 text-emerald-700",
}

function formatCrore(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`
  return `₹${n.toLocaleString("en-IN")}`
}

export default function FirePlanner({ sessionId }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sip, setSip] = useState<number>(0)
  const [returnRate, setReturnRate] = useState<number>(12)
  const [scenarioData, setScenarioData] = useState<any>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)

  useEffect(() => {
    getFirePlan(sessionId)
      .then((d) => {
        setData(d)
        setSip(d.monthly_savings || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sessionId])

  const runScenario = useCallback(
    async (newSip: number, newReturn: number) => {
      if (!sessionId) return
      setScenarioLoading(true)
      try {
        const result = await getFireScenario(sessionId, newSip, newReturn)
        setScenarioData(result)
      } finally {
        setScenarioLoading(false)
      }
    },
    [sessionId]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Calculating your FIRE plan...
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-700">
        Tell Artha-Saathi your income and expenses first to see your FIRE plan.
      </div>
    )
  }

  const active = scenarioData || data
  const fireResult = active.fire_result
  const timeline = active.timeline || []
  const allocation = active.asset_allocation
  const milestones = active.milestones || []
  const sipBreakdown = active.sip_breakdown || {}
  const fireYear = fireResult?.years_to_fire
    ? Math.round(fireResult.years_to_fire)
    : null

  return (
    <div className="space-y-4">

      {/* FIRE summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">FIRE Number</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">
            {fireResult?.fire_number
              ? formatCrore(fireResult.fire_number)
              : "—"}
          </p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">Years to FIRE</p>
          <p className="text-xl font-bold text-blue-800 mt-1">
            {fireResult?.achievable
              ? `${Math.round(fireResult.years_to_fire)} yrs`
              : "Increase savings"}
          </p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-xs text-purple-600 font-medium">Savings Rate</p>
          <p className="text-xl font-bold text-purple-800 mt-1">
            {fireResult?.savings_rate_pct
              ? `${fireResult.savings_rate_pct}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Corpus growth chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
          Corpus Growth Timeline
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }}
                label={{ value: "Years", position: "insideBottom",
                  offset: -2, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }}
                tickFormatter={(v) => v >= 10000000
                  ? `${(v / 10000000).toFixed(1)}Cr`
                  : v >= 100000
                  ? `${(v / 100000).toFixed(0)}L`
                  : v} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  formatCrore(v),
                  name === "corpus" ? "Total Corpus" : "Amount Invested"
                ]}
                labelFormatter={(l) => `Year ${l}`}
              />
              {fireYear && (
                <ReferenceLine x={fireYear} stroke="#059669"
                  strokeDasharray="4 4"
                  label={{ value: "FIRE", fill: "#059669", fontSize: 11 }} />
              )}
              <Area type="monotone" dataKey="corpus" stroke="#059669"
                strokeWidth={2} fill="url(#corpusGrad)" name="corpus" />
              <Area type="monotone" dataKey="invested" stroke="#6366f1"
                strokeWidth={1.5} fill="url(#investedGrad)" name="invested" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenario modeler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Scenario Modeler
          </p>
          {scenarioLoading && (
            <span className="text-xs text-emerald-600 animate-pulse">
              Recalculating...
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600">Monthly SIP</label>
              <span className="text-sm font-medium text-emerald-700">
                ₹{sip.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={200000}
              step={1000}
              value={sip}
              onChange={(e) => {
                const v = Number(e.target.value)
                setSip(v)
                runScenario(v, returnRate)
              }}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>₹1,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600">Expected Annual Return</label>
              <span className="text-sm font-medium text-blue-700">
                {returnRate}%
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={18}
              step={0.5}
              value={returnRate}
              onChange={(e) => {
                const v = Number(e.target.value)
                setReturnRate(v)
                runScenario(sip, v)
              }}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>6% (FD)</span>
              <span>18% (aggressive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset allocation */}
      {allocation && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
            Recommended Asset Allocation
          </p>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">
                {allocation.equity_pct}%
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Equity</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-700">
                {allocation.debt_pct}%
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Debt</p>
            </div>
          </div>

          {/* SIP breakdown per category */}
          {Object.keys(sipBreakdown).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">
                Monthly SIP breakdown
              </p>
              {Object.entries(sipBreakdown).map(([cat, amt]: [string, any]) => (
                <div key={cat}
                  className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-600">{cat}</span>
                  <span className="text-xs font-medium text-gray-800">
                    ₹{Number(amt).toLocaleString("en-IN")}/mo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
            Your Financial Roadmap
          </p>
          <div className="space-y-2">
            {milestones.map((m: any, i: number) => (
              <div key={i}
                className={`flex gap-3 p-3 rounded-xl border text-sm ${
                  PRIORITY_STYLES[m.priority] || "bg-gray-50 border-gray-200"
                }`}>
                <div className="shrink-0 font-semibold text-xs pt-0.5">
                  Age {m.age}
                </div>
                <div>
                  <p className="font-medium text-xs">{m.event}</p>
                  <p className="text-xs opacity-75 mt-0.5">{m.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
