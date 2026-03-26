"use client"

import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { TooltipProps } from "recharts"
import { getFutureShock } from "@/lib/api"
import { SkeletonCard, SkeletonChart } from "./Skeleton"

interface Props {
  sessionId: string
}

function fmt(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

const ICON_MAP: Record<string, string> = {
  tax: "💸",
  sip: "📈",
  insurance: "🛡️",
}

export default function FutureShock({ sessionId }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFutureShock(sessionId)
      .then((d) => {
        if (!d.error) setData(d)
      })
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading)
    return (
      <div className="space-y-4 tab-content">
        <SkeletonCard />
        <SkeletonChart />
      </div>
    )

  if (!data)
    return (
      <div className="panel-card p-6 text-center">
        <p className="text-2xl mb-2">🔮</p>
        <p className="text-sm text-gray-500">
          Tell Artha-Saathi your income and expenses to see your financial future
        </p>
      </div>
    )

  const diff = Number(data.difference_5yr ?? 0)
  const positive = diff > 0

  const currentPath = Array.isArray(data.current_path) ? data.current_path : []
  const optimisedPath = Array.isArray(data.optimised_path) ? data.optimised_path : []

  const chartData = currentPath.map((p: any, i: number) => ({
    year: p.year,
    current: Number(p.corpus ?? 0),
    optimised: Number(optimisedPath[i]?.corpus ?? p.corpus ?? 0),
  }))

  return (
    <div className="space-y-4 tab-content">
      {data.crisis_point && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <span className="text-red-500 text-xl shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Financial Risk Detected</p>
            <p className="text-xs text-red-600 mt-0.5">{data.crisis_point.message}</p>
          </div>
        </div>
      )}

      <div
        className={`rounded-2xl p-5 text-white bg-gradient-to-r ${
          positive ? "from-emerald-500 to-teal-600" : "from-red-500 to-rose-600"
        }`}
      >
        <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
          5-year financial impact of acting now
        </p>
        <p className="text-5xl font-bold leading-none mt-2">
          {positive ? "+" : ""}
          {fmt(diff)}
        </p>
        <p className="text-white/80 text-sm mt-2">
          {positive
            ? `Following this plan gives you ${fmt(diff)} more by ${new Date().getFullYear() + 5}`
            : "Your current path leads to a financial shortfall"}
        </p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-xs text-white/60">Without action</p>
            <p className="text-lg font-bold">{fmt(Number(data.corpus_current_5yr ?? 0))}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="text-xs text-white/60">With this plan</p>
            <p className="text-lg font-bold">{fmt(Number(data.corpus_optimised_5yr ?? 0))}</p>
          </div>
        </div>
      </div>

      <div className="panel-card p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">
          5-year corpus projection
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="curGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(v) => `Yr ${v}`}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  const n = Number(v ?? 0)
                  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
                  if (n >= 100000) return `${(n / 100000).toFixed(0)}L`
                  return `${Math.round(n)}`
                }}
              />

              <Tooltip
                formatter={(value: unknown, name: unknown) => {
                  const n = Number(value ?? 0)
                  const label = name === "optimised" ? "With plan" : "Without action"
                  return [fmt(n), label]
                }}
                labelFormatter={(l) => `Year ${l}`}
                contentStyle={{
                  background: "white",
                  border: "1px solid #f0f0f0",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
              />

              <Area
                type="monotone"
                dataKey="current"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#curGrad)"
                name="current"
                strokeDasharray="5 3"
              />
              <Area
                type="monotone"
                dataKey="optimised"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#optGrad)"
                name="optimised"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div
              className="w-4 h-0.5 bg-red-400 rounded"
              style={{ borderTop: "2px dashed #f87171" }}
            />
            Without action
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-4 h-0.5 bg-emerald-500 rounded" />
            With Artha-Saathi plan
          </div>
        </div>
      </div>

      {data.insights?.length > 0 && (
        <div className="panel-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Where your money is leaking
          </p>
          <div className="space-y-3">
            {data.insights.map((ins: any, i: number) => (
              <div key={i} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <span className="text-lg shrink-0" style={{ fontSize: "16px" }}>
                  {ICON_MAP[ins.icon] ?? "💡"}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-700">{ins.text}</p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    Fix: {ins.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-card p-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
          Monthly investment comparison
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-xs text-red-500 font-medium">Current SIP</p>
            <p className="text-xl font-bold text-red-700 mt-1">
              {fmt(Number(data.current_monthly_sip ?? 0))}
            </p>
            <p className="text-xs text-red-400 mt-0.5">per month</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 font-medium">Recommended SIP</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">
              {fmt(Number(data.optimised_monthly_sip ?? 0))}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">per month</p>
          </div>
        </div>

        {Number(data.annual_tax_saving ?? 0) > 0 && (
          <div className="mt-3 text-center bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              + Tax saving of{" "}
              <span className="font-bold text-sm">
                {fmt(Number(data.annual_tax_saving ?? 0))}
              </span>{" "}
              freed up every year to invest
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
