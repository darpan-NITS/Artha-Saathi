"use client"
import { useState, useRef, useCallback } from "react"

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "processing"

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [state, setState]     = useState<RecordingState>("idle")
  const [error, setError]     = useState<string | null>(null)
  const mediaRecorder          = useRef<MediaRecorder | null>(null)
  const audioChunks            = useRef<Blob[]>([])
  const streamRef              = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4"
      })
      mediaRecorder.current = recorder
      audioChunks.current   = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
  setState("processing")
  const mimeType = recorder.mimeType
  const blob = new Blob(audioChunks.current, { type: mimeType })
  const ext = mimeType.includes("webm") ? "webm" : "mp4"

  const formData = new FormData()
  formData.append("audio", blob, `recording.${ext}`)

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
    const res = await fetch(`${BASE_URL}/voice-to-text`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Voice API error:", res.status, errorText)
      setError(`Server error ${res.status}. Please try again.`)
      setState("idle")
      return
    }

    const data = await res.json()
    console.log("Transcription result:", data)

    if (data.success && data.text?.trim()) {
      const transcript = data.text.trim().toLowerCase()
      const HALLUCINATIONS = ["thank you", "thanks", "bye", "goodbye",
                              "you're welcome", "okay", "ok", ""]
      if (HALLUCINATIONS.some(h => transcript === h || transcript === h + ".")) {
        setError("Couldn't catch that. Please speak clearly for 2–3 seconds.")
      } else {
        onTranscript(data.text.trim())
      }
    } else {
      setError(data.error || "Could not understand. Please try again.")
    }
  } catch (err) {
    console.error("Voice fetch error:", err)
    setError("Connection failed. Check your internet and try again.")
  } finally {
    setState("idle")
    streamRef.current?.getTracks().forEach(t => t.stop())
  }
}

      recorder.start()
      setState("recording")

    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied.")
      } else {
        setError("Could not access microphone.")
      }
      setState("idle")
    }
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop()
    }
  }, [])

  const handleClick = () => {
    if (disabled) return
    if (state === "idle")      startRecording()
    if (state === "recording") stopRecording()
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || state === "processing"}
        title={
          state === "idle"       ? "Click to speak (Hindi or English)" :
          state === "recording"  ? "Recording... click to stop" :
          "Processing..."
        }
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          state === "recording"
            ? "bg-red-500 text-white animate-pulse"
            : state === "processing"
            ? "bg-amber-100 text-amber-600"
            : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {state === "processing" ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        ) : state === "recording" ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm-1 
              16.93A8.001 8.001 0 014 11H2a10 10 0 009 9.93V23h2v-2.07A10 
              10 0 0022 11h-2a8.001 8.001 0 01-7 6.93z"/>
          </svg>
        )}
      </button>

      {/* Recording pulse ring */}
      {state === "recording" && (
        <span className="absolute inset-0 rounded-xl bg-red-400 
          opacity-30 animate-ping pointer-events-none" />
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-12 right-0 bg-red-50 border 
          border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 
          w-48 z-10 shadow-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
