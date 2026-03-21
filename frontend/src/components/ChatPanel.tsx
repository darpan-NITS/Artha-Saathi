"use client"
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
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
    "I earn ₹60,000/month and spend ₹40,000. I am 27, living in Bangalore.",
    "How much do I need to retire at 45?",
    "Should I choose old or new tax regime?",
    "I just got a ₹1 lakh bonus. What should I do with it?",
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

        {/* Welcome / onboarding screen */}
        {messages.length === 0 && (
          <div className="pt-6 pb-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🪙</span>
            </div>
            <p className="text-center text-gray-800 font-semibold text-base mb-1">
              Namaste! I am Artha-Saathi
            </p>
            <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed px-4">
              Your free AI money mentor. I can calculate your Money Health Score,
              build your FIRE retirement plan, and optimize your taxes — all in
              one conversation.
            </p>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
              <p className="text-xs font-medium text-emerald-700 mb-2 uppercase tracking-wide">
                Start by telling me
              </p>
              <div className="space-y-1.5 text-sm text-emerald-800">
                <p>• Your monthly income and expenses</p>
                <p>• Your age and city</p>
                <p>• Any savings or investments you already have</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
  <p className="text-xs text-center text-gray-400 mb-2">
    Or start instantly with a demo persona
  </p>
  <button
    onClick={() => onSend(
      "I am Priya, 27 years old, working as a software engineer in Bangalore. " +
      "I earn ₹75,000 per month and spend about ₹45,000. " +
      "I have ₹80,000 in a savings account, no term insurance, " +
      "and a ₹3 lakh group health insurance from my employer. " +
      "I invest ₹5,000 in an ELSS fund monthly. What is my financial health?"
    )}
    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
  >
    Try Demo — See Priya's Financial Future
  </button>
</div>

            <p className="text-xs text-center text-gray-400 mb-3">
              Or try one of these
            </p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs text-left px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors leading-relaxed"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Assistant avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs mr-2 mt-1 shrink-0">
                AS
              </div>
            )}

            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 mt-1 mb-2">
                        {children}
                      </ol>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 mt-1 mb-2">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm leading-relaxed">{children}</li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="font-semibold text-base mb-2">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="font-semibold text-sm mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-medium text-sm mb-1">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-emerald-400 pl-3 italic text-gray-600 my-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-200 text-gray-700 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs shrink-0">
              AS
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
                <span className="text-xs text-gray-500 ml-2">
                  Artha-Saathi is thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Tell me about your income, savings, goals..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          For educational purposes only · Not SEBI-registered investment advice
        </p>
      </div>
    </div>
  )
}
