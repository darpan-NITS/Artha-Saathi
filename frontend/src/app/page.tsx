"use client"
import { useState, useCallback } from "react"
import ChatPanel from "@/components/ChatPanel"
import DashboardPanel from "@/components/DashboardPanel"
import { Message } from "@/types"
import { sendMessage } from "@/lib/api"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileSnapshot, setProfileSnapshot] = useState<Record<string, any>>({})
  const [calculations, setCalculations] = useState<Record<string, any>>({})
  const [messageCount, setMessageCount] = useState(0)

  const handleSend = useCallback(async (text: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date() },
    ])
    setLoading(true)

    try {
      const data = await sendMessage(text, sessionId || undefined)
      setSessionId(data.session_id)
      setProfileSnapshot(data.profile_snapshot || {})
      setCalculations(data.calculations || {})
      setMessageCount((c) => c + 1)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, timestamp: new Date() },
      ])
    } catch (err) {
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
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-700">Artha</span>
          <span className="text-lg font-bold text-gray-800">Saathi</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">
            AI Money Mentor
          </span>
        </div>
        <p className="text-xs text-gray-400">
          For educational purposes · Not SEBI-registered advice
        </p>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-1/2 bg-white border-r border-gray-100 flex flex-col">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
          />
        </div>

        {/* Right: Dashboard */}
        <div className="w-1/2 bg-gray-50">
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