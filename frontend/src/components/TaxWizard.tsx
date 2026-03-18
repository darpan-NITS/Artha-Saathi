"use client"
import { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"
import { getTaxPlan, optimizeTax } from "@/lib/api"

interface Props {
  sessionId: string
}

function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

export default function TaxWizard({ sessionId }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [c80c, setC80c] = useState(0)
  const [c80d, setC80d] = useState(0)
  const [nps, setNps] = useState(0)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    getTaxPlan(sessionId).then((d) => {
      if (!d.error) {
        setData(d)
        setC80c(d.current_deductions?.section_80c || 0)
        setC80d(d.current_deductions?.section_80d || 0)
        setNps(d.current_deductions?.nps_80ccd1b || 0)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Calculating your tax liability...
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-700">
        Tell Artha-Saathi your monthly income first to see your tax analysis.
      </div>
    )
  }

  const { tax_result, opportunities, total_potential_saving,
          monthly_difference, gross_annual_income } = data

  const oldTax = tax_result.old_regime.total_tax
  const newTax = tax_result.new_regime.total_tax
  const betterRegime = tax_result.recommendation
  const saving = tax_result.tax_savings_by_choosing_better

  const chartData = [
    {
      name: "Old Regime",
      tax: Math.round(oldTax),
      fill: betterRegime === "old" ? "#059669" : "#e11d48"
    },
    {
      name: "New Regime",
      tax: Math.round(newTax),
      fill: betterRegime === "new" ? "#059669" : "#e11d48"
    },
  ]

  return (
    <div className="space-y-4">

      {/* Regime comparison banner */}
      <div className={`rounded-2xl p-4 border ${
        betterRegime === "new"
          ? "bg-emerald-50 border-emerald-200"
          : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Better Regime for You
            </p>
            <p className={`text-xl font-bold mt-1 ${
              betterRegime === "new" ? "text-emerald-700" : "text-blue-700"
            }`}>
              {betterRegime === "new" ? "New Regime" : "Old Regime"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              You save {fmt(saving)}/year · {fmt(Math.round(saving / 12))}/month
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Annual income</p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">
              {fmt(gross_annual_income)}
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side tax comparison chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">
          Tax Liability Comparison
        </p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 10 }}
                tickFormatter={(v) => v >= 100000
                  ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: number) => [fmt(v), "Total Tax"]} />
              <Bar dataKey="tax" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {["old_regime", "new_regime"].map((regime) => {
            const r = tax_result[regime]
            const isWinner = tax_result.recommendation === regime.split("_")[0]
            return (
              <div key={regime}
                className={`rounded-xl p-3 border ${
                  isWinner
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-100 bg-gray-50"
                }`}>
                <p className={`text-xs font-medium mb-2 ${
                  isWinner ? "text-emerald-700" : "text-gray-500"
                }`}>
                  {regime === "old_regime" ? "Old Regime" : "New Regime"}
                  {isWinner && " ✓"}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Taxable income</span>
                    <span className="font-medium">{fmt(r.taxable_income)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tax + cess</span>
                    <span className="font-medium">{fmt(r.total_tax)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Effective rate</span>
                    <span className="font-medium">{r.effective_rate_pct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deduction optimizer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Deduction Optimizer
          </p>
          {optimizing && (
            <span className="text-xs text-emerald-600 animate-pulse">
              Recalculating...
            </span>
          )}
        </div>

        <div className="space-y-5">
          {/* 80C */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-700 font-medium">
                80C — ELSS / PPF / LIC
              </label>
              <span className="text-sm font-semibold text-emerald-700">
                {fmt(c80c)}
                <span className="text-xs text-gray-400 font-normal"> / ₹1.5L</span>
              </span>
            </div>
            <input type="range" min={0} max={150000} step={5000}
              value={c80c}
              onChange={(e) => {
                const v = Number(e.target.value)
                setC80c(v)
                runOptimize(v, c80d, nps)
              }}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>₹0</span>
              <span className="text-emerald-600 font-medium">
                Unused: {fmt(Math.max(0, 150000 - c80c))}
              </span>
              <span>₹1.5L (max)</span>
            </div>
          </div>

          {/* 80D */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-700 font-medium">
                80D — Health Insurance
              </label>
              <span className="text-sm font-semibold text-blue-700">
                {fmt(c80d)}
                <span className="text-xs text-gray-400 font-normal"> / ₹25k</span>
              </span>
            </div>
            <input type="range" min={0} max={25000} step={1000}
              value={c80d}
              onChange={(e) => {
                const v = Number(e.target.value)
                setC80d(v)
                runOptimize(c80c, v, nps)
              }}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>₹0</span>
              <span className="text-blue-600 font-medium">
                Unused: {fmt(Math.max(0, 25000 - c80d))}
              </span>
              <span>₹25k (max)</span>
            </div>
          </div>

          {/* NPS 80CCD(1B) */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-700 font-medium">
                80CCD(1B) — NPS Extra
              </label>
              <span className="text-sm font-semibold text-purple-700">
                {fmt(nps)}
                <span className="text-xs text-gray-400 font-normal"> / ₹50k</span>
              </span>
            </div>
            <input type="range" min={0} max={50000} step={1000}
              value={nps}
              onChange={(e) => {
                const v = Number(e.target.value)
                setNps(v)
                runOptimize(c80c, c80d, v)
              }}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>₹0</span>
              <span className="text-purple-600 font-medium">
                Unused: {fmt(Math.max(0, 50000 - nps))}
              </span>
              <span>₹50k (max)</span>
            </div>
          </div>
        </div>

        {/* Total potential saving */}
        {total_potential_saving > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              💡 By maxing all deductions above, you could save up to{" "}
              <span className="font-bold">{fmt(total_potential_saving)}</span>{" "}
              more in taxes this year
            </p>
          </div>
        )}
      </div>

      {/* Opportunities */}
      {opportunities?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">
            Missed Deductions
          </p>
          <div className="space-y-3">
            {opportunities.map((opp: any, i: number) => (
              <div key={i}
                className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    Section {opp.section}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">
                    Save ~{fmt(opp.estimated_tax_saving)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 mt-1">
                  {opp.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Used {fmt(opp.current)} of {fmt(opp.limit)} limit
                  · {fmt(opp.gap)} remaining
                </p>
                <div className="mt-2 space-y-0.5">
                  {opp.options.map((opt: string, j: number) => (
                    <p key={j} className="text-xs text-gray-500">
                      • {opt}
                    </p>
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
