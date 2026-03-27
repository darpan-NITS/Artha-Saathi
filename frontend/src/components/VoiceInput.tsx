"use client"
import { useState, useRef, useCallback } from "react"

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type RecordingState = "idle" | "recording" | "processing"

const HALLUCINATIONS = [
  "thank you", "thanks", "bye", "goodbye",
  "you're welcome", "okay", "ok", ".", ""
]

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [state, setState]  = useState<RecordingState>("idle")
  const [error, setError]  = useState<string | null>(null)
  const mediaRecorder       = useRef<MediaRecorder | null>(null)
  const audioChunks         = useRef<Blob[]>([])
  const streamRef           = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.current = recorder
      audioChunks.current   = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      recorder.onstop = async () => {
        setState("processing")

        const recordedMime = recorder.mimeType
        const blob = new Blob(audioChunks.current, { type: recordedMime })
        const ext  = recordedMime.includes("webm") ? "webm" : "mp4"

        // Reject if too small — causes Whisper hallucinations
        if (blob.size < 10000) {
          setError("Too short. Please hold and speak for 2–3 seconds.")
          setState("idle")
          streamRef.current?.getTracks().forEach(t => t.stop())
          return
        }

        const formData = new FormData()
        formData.append("audio", blob, `recording.${ext}`)

        try {
          const BASE_URL =
            process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

          const res = await fetch(`${BASE_URL}/voice-to-text`, {
            method: "POST",
            body: formData,
          })

          const data = await res.json()

          if (!res.ok) {
            setError(data.error || `Server error ${res.status}. Try again.`)
            return
          }

          if (data.success && data.text?.trim()) {
            const transcript = data.text.trim()
            const lower      = transcript.toLowerCase().replace(/\.$/, "")

            if (HALLUCINATIONS.includes(lower)) {
              setError("Couldn't catch that. Speak clearly for 2–3 seconds.")
            } else {
              onTranscript(transcript)
            }
          } else {
            setError(data.error || "Could not understand. Please try again.")
          }

        } catch {
          setError("Connection failed. Check internet and try again.")
        } finally {
          setState("idle")
          streamRef.current?.getTracks().forEach(t => t.stop())
        }
      }

      recorder.start()
      setState("recording")

    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Allow mic access and retry.")
      } else if (err.name === "NotFoundError") {
        setError("No microphone found on this device.")
      } else {
        setError("Could not access microphone. Please try again.")
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
          state === "idle"      ? "Click to speak — English or Hindi" :
          state === "recording" ? "Recording... click to stop" :
          "Processing your voice..."
        }
        className={`w-10 h-10 rounded-xl flex items-center justify-center
          transition-all duration-200 ${
          state === "recording"
            ? "bg-red-500 text-white"
            : state === "processing"
            ? "bg-amber-100 text-amber-600"
            : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {state === "processing" ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        ) : state === "recording" ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4z"/>
            <path d="M19 11a7 7 0 01-14 0H3a9 9 0 008 8.94V22h2v-2.06A9 9 0 0021 11h-2z"/>
          </svg>
        )}
      </button>

      {/* Pulse ring when recording */}
      {state === "recording" && (
        <span className="absolute inset-0 rounded-xl bg-red-400
          opacity-40 animate-ping pointer-events-none" />
      )}

      {/* Recording duration hint */}
      {state === "recording" && (
        <div className="absolute bottom-12 right-0 bg-red-500 text-white
          text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-sm">
          Speak now... click to stop
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-12 right-0 bg-red-50 border
          border-red-200 text-red-700 text-xs rounded-xl px-3 py-2
          w-52 z-10 shadow-sm leading-relaxed">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-1 text-red-400 hover:text-red-600 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
