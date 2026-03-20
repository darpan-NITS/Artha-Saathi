"use client"
import { useState, useEffect, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import { getFirePlan, getFireScenario } from "@/lib/api"
import { SkeletonCard, SkeletonChart } from "./Skeleton"

interface Props { sessionId: string }

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-50   border-red-200   text-red-700",
  high:   "bg-amber-50 border-amber-200 text-amber-700",
  medium: "bg-blue-50  border-blue-200  text-blue-700",
  goal:   "bg-emerald-50 border-emerald-200 text-emerald-700",
}

function formatCrore(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`
  return `₹${n.toLocaleString("en-IN")}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-medium text-gray-600 mb-1">Year {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "corpus" ? "Total Corpus" : "Amount Invested"}: {formatCrore(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function FirePlanner({ sessionId }: Props) {
  const [data,            setData]            = useState<any>(null)
  const [loading,         setLoading]         = useState(true)
  const [sip,             setSip]             = useState(0)
  const [returnRate,      setReturnRate]      = useState(12)
  const [scenarioData,    setScenarioData]    = useState<any>(null)
  const [scenarioLoading, setScenarioLoading] = useState(false)

  useEffect(() => {
    getFirePlan(sessionId).then((d) => {
      setData(d)
      setSip(d.monthly_savings || 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [sessionId])

  const runScenario = useCallback(async (newSip: number, newReturn: number) => {
    setScenarioLoading(true)
    try {
      const result = await getFireScenario(sessionId, newSip, newReturn)
      setScenarioData(result)
    } finally {
      setScenarioLoading(false)
    }
  }, [sessionId])

  if (loading) return (
    <div className="space-y-4 tab-content">
      <SkeletonCard /><SkeletonChart /><SkeletonCard />
    </div>
  )

  if (!data || data.error) return (
    <div className="panel-card p-5 text-sm text-amber-700 bg-amber-50 border border-amber-200">
      Tell Artha-Saathi your income and expenses first to see your FIRE plan.
    </div>
  )

  const active     = scenarioData || data
  const fireResult = active.fire_result
  const timeline   = active.timeline || []
  const allocation = active.asset_allocation
  const milestones = active.milestones || []
  const sipBreakdown = active.sip_breakdown || {}
  const fireYear   = fireResult?.years_to_fire ? Math.round(fireResult.years_to_fire) : null

  return (
    <div className="space-y-4 tab-content">

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "FIRE Number",
            value: fireResult?.fire_number ? formatCrore(fireResult.fire_number) : "—",
            gradient: "from-emerald-500 to-teal-500",
          },
          {
            label: "Years to FIRE",
            value: fireResult?.achievable
              ? `${Math.round(fireResult.years_to_fire)} yrs` : "↑ savings",
            gradient: "from-blue-500 to-indigo-500",
          },
          {
            label: "Savings Rate",
            value: fireResult?.savings_rate_pct ? `${fireResult.savings_rate_pct}%` : "—",
            gradient: "from-violet-500 to-purple-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 text-white`}
          >
            <p className="text-xs text-white/70 font-medium">{card.label}</p>
            <p className="text-xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="panel-card p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
          Corpus Growth Timeline
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr`
                  : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v
                }
              />
              <Tooltip content={<CustomTooltip />} />
              {fireYear && (
                <ReferenceLine
                  x={fireYear}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  label={{ value: "🎯 FIRE", fill: "#059669", fontSize: 11 }}
                />
              )}
              <Area
                type="monotone" dataKey="corpus"
                stroke="#059669" strokeWidth={2.5}
                fill="url(#corpusGrad)" name="corpus"
              />
              <Area
                type="monotone" dataKey="invested"
                stroke="#6366f1" strokeWidth={1.5}
                fill="url(#investedGrad)" name="invested"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-0.5 bg-emerald-500 rounded" />
            Total Corpus
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-0.5 bg-indigo-500 rounded" />
            Amount Invested
          </div>
        </div>
      </div>

      {/* Scenario modeler */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Scenario Modeler
          </p>
          {scenarioLoading && (
            <span className="text-xs text-emerald-600 animate-pulse font-medium">
              ↻ Recalculating...
            </span>
          )}
        </div>
        <div className="space-y-5">
          {[
            {
              label: "Monthly SIP",
              value: sip,
              setValue: setSip,
              min: 1000, max: 200000, step: 1000,
              display: `₹${sip.toLocaleString("en-IN")}`,
              minLabel: "₹1,000", maxLabel: "₹2,00,000",
              accent: "accent-emerald-600",
              onChange: (v: number) => runScenario(v, returnRate),
            },
            {
              label: "Expected Annual Return",
              value: returnRate,
              setValue: setReturnRate,
              min: 6, max: 18, step: 0.5,
              display: `${returnRate}%`,
              minLabel: "6% (FD)", maxLabel: "18% (aggressive)",
              accent: "accent-blue-600",
              onChange: (v: number) => runScenario(sip, v),
            },
          ].map((slider) => (
            <div key={slider.label}>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-600 font-medium">
                  {slider.label}
                </label>
                <span className="text-sm font-bold text-gray-800">
                  {slider.display}
                </span>
              </div>
              <input
                type="range"
                min={slider.min} max={slider.max} step={slider.step}
                value={slider.value}
                className={`w-full ${slider.accent}`}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  slider.setValue(v)
                  slider.onChange(v)
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{slider.minLabel}</span>
                <span>{slider.maxLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset allocation */}
      {allocation && (
        <div className="panel-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
            Recommended Allocation
          </p>
          {/* Visual allocation bar */}
          <div className="flex rounded-xl overflow-hidden h-4 mb-4">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
              style={{ width: `${allocation.equity_pct}%` }}
            />
            <div
              className="bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${allocation.debt_pct}%` }}
            />
          </div>
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              Equity {allocation.equity_pct}%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
              Debt {allocation.debt_pct}%
            </div>
          </div>

          {Object.keys(sipBreakdown).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">Monthly SIP breakdown</p>
              {Object.entries(sipBreakdown).map(([cat, amt]: [string, any]) => (
                <div key={cat}
                  className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-600">{cat}</span>
                  <span className="text-xs font-semibold text-gray-800">
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
        <div className="panel-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Your Financial Roadmap
          </p>
          <div className="relative">
            <div className="absolute left-[30px] top-2 bottom-2 w-0.5 bg-gray-100" />
            <div className="space-y-3">
              {milestones.map((m: any, i: number) => (
                <div key={i} className="flex gap-3 items-start relative">
                  <div className={`w-[60px] shrink-0 text-xs font-semibold text-center
                    py-1 rounded-lg border ${PRIORITY_STYLES[m.priority]}`}>
                    Age {m.age}
                  </div>
                  <div className={`flex-1 p-3 rounded-xl border text-sm ${PRIORITY_STYLES[m.priority]}`}>
                    <p className="font-medium text-xs">{m.event}</p>
                    <p className="text-xs opacity-75 mt-0.5">{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
