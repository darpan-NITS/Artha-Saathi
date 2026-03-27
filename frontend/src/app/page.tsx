"use client"
import { useState, useCallback } from "react"
import ChatPanel from "@/components/ChatPanel"
import DashboardPanel from "@/components/DashboardPanel"
import { Message } from "@/types"
import { sendMessage } from "@/lib/api"

export default function Home() {
  const [messages, setMessages]           = useState<Message[]>([])
  const [sessionId, setSessionId]         = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [profileSnapshot, setProfile]     = useState<Record<string, any>>({})
  const [calculations, setCalculations]   = useState<Record<string, any>>({})
  const [messageCount, setMessageCount]   = useState(0)
  const [showDashboard, setShowDashboard] = useState(false)

  const handleSend = useCallback(async (text: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date() },
    ])
    setLoading(true)
    setShowDashboard(true)

    try {
      const data = await sendMessage(text, sessionId || undefined)
      setSessionId(data.session_id)
      setProfile(data.profile_snapshot || {})
      setCalculations(data.calculations || {})
      setMessageCount((c) => c + 1)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  return (
    <main className="h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-emerald-700">Artha</span>
          <span className="text-lg font-bold text-gray-800">Saathi</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            AI Money Mentor
          </span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full hidden sm:flex items-center gap-1">
            💬 WhatsApp
          </span>
        </div>
        <p className="text-xs text-gray-400 hidden md:block">
          For educational purposes · Not SEBI-registered advice
        </p>

        {/* Mobile toggle button */}
        {sessionId && (
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="md:hidden text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 bg-white"
          >
            {showDashboard ? "💬 Chat" : "📊 Dashboard"}
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Chat panel — hidden on mobile when dashboard is shown */}
        <div className={`
          w-full md:w-1/2 bg-white border-r border-gray-100 flex flex-col
          ${showDashboard ? "hidden md:flex" : "flex"}
        `}>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
          />
        </div>

        {/* Dashboard panel — hidden on mobile when chat is shown */}
        <div className={`
          w-full md:w-1/2 bg-gray-50 overflow-y-auto
          ${showDashboard ? "flex flex-col" : "hidden md:block"}
        `}>
          <DashboardPanel
            sessionId={sessionId}
            profileSnapshot={profileSnapshot}
            calculations={calculations}
            messageCount={messageCount}
          />
        </div>

      </div>
    </main>
  )
}
