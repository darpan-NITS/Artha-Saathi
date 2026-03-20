"use client"
import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"
import { getTaxPlan, optimizeTax } from "@/lib/api"
import { SkeletonCard, SkeletonChart } from "./Skeleton"

interface Props { sessionId: string }

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p style={{ color: payload[0].fill }}>
        Total Tax: {fmt(payload[0].value)}
      </p>
    </div>
  )
}

export default function TaxWizard({ sessionId }: Props) {
  const [data,       setData]       = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [c80c,       setC80c]       = useState(0)
  const [c80d,       setC80d]       = useState(0)
  const [nps,        setNps]        = useState(0)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    getTaxPlan(sessionId).then((d) => {
      if (!d.error) {
        setData(d)
        setC80c(d.current_deductions?.section_80c || 0)
        setC80d(d.current_deductions?.section_80d || 0)
        setNps(d.current_deductions?.nps_80ccd1b  || 0)
      }
      setLoading(false)
    })
  }, [sessionId])

  const runOptimize = useCallback(
    async (new80c: number, new80d: number, newNps: number) => {
      setOptimizing(true)
      try {
        const result = await optimizeTax(sessionId, new80c, new80d, newNps)
        if (!result.error) setData(result)
      } finally {
        setOptimizing(false)
      }
    },
    [sessionId]
  )

  if (loading) return (
    <div className="space-y-4 tab-content">
      <SkeletonCard /><SkeletonChart /><SkeletonCard />
    </div>
  )

  if (!data || data.error) return (
    <div className="panel-card p-5 text-sm text-amber-700 bg-amber-50 border border-amber-200">
      Tell Artha-Saathi your monthly income first to see your tax analysis.
    </div>
  )

  const {
    tax_result, opportunities, total_potential_saving, gross_annual_income
  } = data

  const oldTax      = tax_result.old_regime.total_tax
  const newTax      = tax_result.new_regime.total_tax
  const betterRegime = tax_result.recommendation
  const saving      = tax_result.tax_savings_by_choosing_better

  const chartData = [
    { name: "Old Regime", tax: Math.round(oldTax), fill: betterRegime === "old" ? "#059669" : "#f43f5e" },
    { name: "New Regime", tax: Math.round(newTax), fill: betterRegime === "new" ? "#059669" : "#f43f5e" },
  ]

  const deductions = [
    {
      key: "80c", label: "80C — ELSS / PPF / LIC",
      value: c80c, setValue: setC80c,
      max: 150000, step: 5000,
      display: fmt(c80c), limit: "₹1.5L",
      unused: Math.max(0, 150000 - c80c),
      accent: "accent-emerald-600", color: "text-emerald-700",
      onChange: (v: number) => runOptimize(v, c80d, nps),
    },
    {
      key: "80d", label: "80D — Health Insurance",
      value: c80d, setValue: setC80d,
      max: 25000, step: 1000,
      display: fmt(c80d), limit: "₹25k",
      unused: Math.max(0, 25000 - c80d),
      accent: "accent-blue-600", color: "text-blue-700",
      onChange: (v: number) => runOptimize(c80c, v, nps),
    },
    {
      key: "nps", label: "80CCD(1B) — NPS Extra",
      value: nps, setValue: setNps,
      max: 50000, step: 1000,
      display: fmt(nps), limit: "₹50k",
      unused: Math.max(0, 50000 - nps),
      accent: "accent-purple-600", color: "text-purple-700",
      onChange: (v: number) => runOptimize(c80c, c80d, v),
    },
  ]

  return (
    <div className="space-y-4 tab-content">

      {/* Winner banner */}
      <div className={`bg-gradient-to-r rounded-2xl p-5 text-white ${
        betterRegime === "new"
          ? "from-emerald-500 to-teal-500"
          : "from-blue-500 to-indigo-600"
      }`}>
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
          Better Regime for You
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">
              {betterRegime === "new" ? "New Regime" : "Old Regime"}
            </p>
            <p className="text-white/80 text-sm mt-1">
              You save {fmt(saving)}/year · {fmt(Math.round(saving / 12))}/month
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Annual income</p>
            <p className="text-lg font-bold">{fmt(gross_annual_income)}</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="panel-card p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
          Tax Liability Comparison
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={64}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) =>
                  v >= 100000 ? `${(v / 100000).toFixed(1)}L`
                  : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="tax" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Side-by-side details */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(["old_regime", "new_regime"] as const).map((regime) => {
            const r        = tax_result[regime]
            const isWinner = tax_result.recommendation === regime.split("_")[0]
            return (
              <div key={regime}
                className={`rounded-xl p-3 border ${
                  isWinner
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-100 bg-gray-50"
                }`}>
                <p className={`text-xs font-semibold mb-2 ${
                  isWinner ? "text-emerald-700" : "text-gray-500"
                }`}>
                  {regime === "old_regime" ? "Old" : "New"} Regime
                  {isWinner && " ✓"}
                </p>
                {[
                  ["Taxable income", fmt(r.taxable_income)],
                  ["Tax + cess",     fmt(r.total_tax)],
                  ["Effective rate", `${r.effective_rate_pct}%`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-0.5">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-700">{val}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Deduction optimizer */}
      <div className="panel-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
            Deduction Optimizer
          </p>
          {optimizing && (
            <span className="text-xs text-emerald-600 animate-pulse font-medium">
              ↻ Recalculating...
            </span>
          )}
        </div>

        <div className="space-y-5">
          {deductions.map((d) => (
            <div key={d.key}>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-700 font-medium">{d.label}</label>
                <div className="text-right">
                  <span className={`text-sm font-bold ${d.color}`}>{d.display}</span>
                  <span className="text-xs text-gray-400"> / {d.limit}</span>
                </div>
              </div>
              <input
                type="range" min={0} max={d.max} step={d.step}
                value={d.value} className={`w-full ${d.accent}`}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  d.setValue(v)
                  d.onChange(v)
                }}
              />
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">₹0</span>
                <span className={`font-medium ${d.color}`}>
                  {d.unused > 0 ? `Unused: ${fmt(d.unused)}` : "✓ Maxed out"}
                </span>
                <span className="text-gray-400">{d.limit} (max)</span>
              </div>
            </div>
          ))}
        </div>

        {total_potential_saving > 0 && (
          <div className="mt-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800">
              💡 Max all deductions → save up to{" "}
              <span className="text-base font-bold">{fmt(total_potential_saving)}</span>
              {" "}more in taxes this year
            </p>
          </div>
        )}
      </div>

      {/* Opportunities */}
      {opportunities?.length > 0 && (
        <div className="panel-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Missed Deductions
          </p>
          <div className="space-y-3">
            {opportunities.map((opp: any, i: number) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    Section {opp.section}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    Save ~{fmt(opp.estimated_tax_saving)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {opp.title}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(opp.current / opp.limit) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {fmt(opp.current)} / {fmt(opp.limit)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {opp.options.map((opt: string, j: number) => (
                    <p key={j} className="text-xs text-gray-500">• {opt}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
