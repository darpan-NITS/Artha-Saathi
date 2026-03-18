"use client"
import { useState, useRef, useEffect } from "react"
import { Message } from "@/types"

interface Props {
  messages: Message[]
  onSend: (message: string) => void
  loading: boolean
}

export default function ChatPanel({ messages, onSend, loading }: Props) {
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput("")
  }

  const suggestions = [
    "Check my financial health score",
    "When can I retire?",
    "Help me save tax",
    "How much SIP should I do?",
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
            AS
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">Artha-Saathi</p>
            <p className="text-xs text-emerald-600">● Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-gray-800 font-medium mb-1">
              Namaste! I am Artha-Saathi
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your personal AI money mentor. Tell me about your finances and
              I will build your complete financial plan.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs text-left px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                <span className="text-xs text-gray-500 ml-2">
                  Artha-Saathi is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell me about your income, savings, goals..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}