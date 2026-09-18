"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { saveNote } from "@/actions/notes"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Square, Loader2, Sparkles, Wand2, RefreshCw, AlertTriangle } from "lucide-react"

type UIState = "READY" | "RECORDING" | "TRANSCRIBING" | "ENHANCING" | "REVIEW" | "ERROR"
type RecordingMethod = "speech_api" | "media_recorder" | "unknown"

// Detect best MIME type for MediaRecorder
function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ""
}

export default function VoiceNotePage() {
  const router = useRouter()
  const [uiState, setUiState] = useState<UIState>("READY")
  const [rawText, setRawText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [enhancedText, setEnhancedText] = useState("")
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [recordingMethod, setRecordingMethod] = useState<RecordingMethod>("unknown")
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isRecordingRef = useRef(false)

  // Detect recording capability
  useEffect(() => {
    const hasSpeechApi = !!(
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    )
    const hasMediaRecorder = typeof MediaRecorder !== "undefined"

    if (hasSpeechApi) {
      setRecordingMethod("speech_api")
    } else if (hasMediaRecorder) {
      setRecordingMethod("media_recorder")
    } else {
      setRecordingMethod("unknown")
      setErrorMsg("Your browser does not support voice recording. Please use Chrome or Safari.")
    }
  }, [])

  // Timer tick
  const startTimer = () => {
    setRecordingSeconds(0)
    timerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  // ── SPEECH API PATH ──
  const startSpeechRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " "
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) setRawText(prev => prev + finalTranscript)
      setInterimText(interimTranscript)
    }

    recognition.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error)
      if (event.error === "not-allowed") {
        setErrorMsg("Microphone permission denied. Please allow microphone access and try again.")
      } else if (event.error !== "aborted") {
        setErrorMsg("Speech recognition error: " + event.error)
      }
      stopSpeechRecording()
    }

    recognition.onend = () => {
      // If still in recording state, it may have stopped unexpectedly (Android bug)
      if (isRecordingRef.current) {
        // Auto-submit what we have
        stopSpeechRecording()
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      isRecordingRef.current = true
      setUiState("RECORDING")
      startTimer()
    } catch (err: any) {
      setErrorMsg("Could not start microphone: " + err.message)
    }
  }

  const stopSpeechRecording = useCallback(() => {
    isRecordingRef.current = false
    stopTimer()
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setInterimText("")
  }, [])

  // ── MEDIA RECORDER PATH (Android fallback) ──
  const startMediaRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stopTimer()
        const mimeUsed = mimeType || "audio/webm"
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeUsed })
        // Release stream
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        await transcribeBlob(audioBlob, mimeUsed)
      }

      mediaRecorder.start(1000) // collect chunks every 1s
      isRecordingRef.current = true
      setUiState("RECORDING")
      startTimer()
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setErrorMsg("Microphone permission denied. Please allow microphone access and try again.")
      } else {
        setErrorMsg("Could not start microphone: " + err.message)
      }
    }
  }

  const stopMediaRecording = () => {
    isRecordingRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      setUiState("TRANSCRIBING")
    }
  }

  const transcribeBlob = async (blob: Blob, mimeType: string) => {
    setUiState("TRANSCRIBING")
    try {
      const formData = new FormData()
      formData.append("audio", blob, `recording.${mimeType.split("/")[1]?.split(";")[0] || "webm"}`)
      formData.append("mimeType", mimeType)

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Transcription failed")

      setRawText(data.transcription)
      await enhanceNote(data.transcription)
    } catch (err: any) {
      console.error("Transcription error:", err)
      setErrorMsg(err.message || "Failed to transcribe audio")
      setUiState("ERROR")
    }
  }

  // ── UNIFIED CONTROLS ──
  const startRecording = () => {
    setRawText("")
    setInterimText("")
    setErrorMsg("")
    setEnhancedText("")

    if (recordingMethod === "speech_api") {
      startSpeechRecording()
    } else if (recordingMethod === "media_recorder") {
      startMediaRecording()
    }
  }

  const stopRecording = useCallback(() => {
    if (recordingMethod === "speech_api") {
      stopSpeechRecording()
      setUiState("ENHANCING")
      // Small delay to allow final results to come in
      setTimeout(() => {
        setRawText(prev => {
          const finalText = prev + interimText
          if (finalText.trim()) {
            enhanceNote(finalText)
          } else {
            setUiState("READY")
          }
          return prev
        })
        setInterimText("")
      }, 300)
    } else {
      stopMediaRecording()
    }
  }, [recordingMethod, stopSpeechRecording, interimText])

  const enhanceNote = async (textToEnhance: string) => {
    setUiState("ENHANCING")
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEnhance }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Enhancement failed")

      setEnhancedText(data.enhancedText)
      setUiState("REVIEW")
    } catch (err: any) {
      console.error("Enhancement error:", err)
      // Don't lose the text — still allow saving raw
      setEnhancedText(textToEnhance)
      setErrorMsg("AI enhancement failed. You can still edit and save the raw text.")
      setUiState("REVIEW")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enhancedText.trim()) return

    setIsSaving(true)
    try {
      await saveNote({
        title: title.trim(),
        rawContent: rawText || undefined,
        enhancedContent: rawText !== enhancedText ? enhancedText : undefined,
        finalContent: enhancedText,
        inputMethod: "VOICE",
      })
      router.refresh()
      router.push("/notes")
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Failed to save note: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const reset = () => {
    setUiState("READY")
    setRawText("")
    setInterimText("")
    setEnhancedText("")
    setTitle("")
    setErrorMsg("")
    setRecordingSeconds(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (recognitionRef.current) { try { recognitionRef.current.stop() } catch {} }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full">

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 text-red-300 p-4 rounded-xl mb-6 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-200 shrink-0">✕</button>
        </div>
      )}

      {/* READY / RECORDING */}
      {(uiState === "READY" || uiState === "RECORDING") && (
        <div className="flex flex-col items-center gap-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {uiState === "RECORDING" ? "Recording..." : "Voice Note"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {uiState === "RECORDING"
                ? `${formatTime(recordingSeconds)} — tap stop when done`
                : "Tap the mic and speak naturally"}
            </p>
          </div>

          {/* Big Record Button */}
          <div className="relative flex items-center justify-center">
            {uiState === "RECORDING" && (
              <>
                <div className="absolute h-36 w-36 rounded-full bg-red-500/10 animate-ping" />
                <div className="absolute h-44 w-44 rounded-full bg-red-500/5 animate-pulse" />
              </>
            )}
            <button
              onClick={uiState === "RECORDING" ? stopRecording : startRecording}
              disabled={recordingMethod === "unknown"}
              className={`relative z-10 flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full transition-all duration-200 shadow-2xl active:scale-95 ${
                uiState === "RECORDING"
                  ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {uiState === "RECORDING"
                ? <Square className="h-10 w-10 text-white fill-white" />
                : <Mic className="h-12 w-12 text-primary-foreground" />}
            </button>
          </div>

          {/* Live transcript */}
          <div className="w-full min-h-[120px] bg-card border border-border rounded-xl p-4 text-sm leading-relaxed shadow-lg">
            {!rawText && !interimText ? (
              <p className="text-muted-foreground italic text-center mt-6">
                {uiState === "RECORDING" ? "Listening..." : "Your transcription will appear here"}
              </p>
            ) : (
              <p>
                <span className="text-foreground font-medium">{rawText}</span>
                <span className="text-muted-foreground">{interimText}</span>
              </p>
            )}
          </div>

          {recordingMethod === "media_recorder" && (
            <p className="text-xs text-white/25 text-center">Using audio recording mode (Android compatible)</p>
          )}
        </div>
      )}

      {/* TRANSCRIBING */}
      {uiState === "TRANSCRIBING" && (
        <div className="flex flex-col items-center gap-6 py-16">
          <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white/60 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Transcribing audio...</p>
            <p className="text-white/40 text-sm mt-1">Converting your voice to text</p>
          </div>
        </div>
      )}

      {/* ENHANCING */}
      {uiState === "ENHANCING" && (
        <div className="flex flex-col items-center gap-6 py-10">
          <div className="h-20 w-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Enhancing with AI...</p>
            <p className="text-white/40 text-sm mt-1">Fixing grammar and structuring your note</p>
          </div>
          {/* Show the raw transcript so the user can see what was captured */}
          {rawText && (
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mic className="h-3 w-3" /> Transcribed text
              </p>
              <p className="text-white/60 text-sm leading-relaxed">{rawText}</p>
            </div>
          )}
        </div>
      )}

      {/* ERROR */}
      {uiState === "ERROR" && (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <div>
            <p className="text-white font-medium">Something went wrong</p>
            <p className="text-white/40 text-sm mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* REVIEW */}
      {uiState === "REVIEW" && (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-secondary" />
              <h1 className="text-lg font-semibold text-foreground">Review & Save</h1>
            </div>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Start over
            </button>
          </div>

          {/* Title */}
          <Input
            placeholder="Note title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-white/20 h-11"
          />

          {/* Raw transcription (if from voice, show as reference) */}
          {rawText && rawText !== enhancedText && (
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <p className="text-xs text-white/30 font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mic className="h-3 w-3" /> Original transcript
              </p>
              <p className="text-white/40 text-sm leading-relaxed">{rawText}</p>
            </div>
          )}

          {/* Enhanced note — editable */}
          <div className="bg-white/[0.04] border border-purple-500/20 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-purple-500/5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <p className="text-xs text-purple-300 font-medium">AI Enhanced — edit freely</p>
            </div>
            <Textarea
              value={enhancedText}
              onChange={(e) => setEnhancedText(e.target.value)}
              className="min-h-[260px] sm:min-h-[320px] resize-none border-0 bg-transparent focus-visible:ring-0 text-white/90 p-4 text-sm leading-relaxed rounded-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={reset}
              className="flex-1 h-11 border border-border text-muted-foreground text-sm font-medium rounded-xl hover:bg-card hover:text-foreground transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSaving || !enhancedText.trim()}
              className="flex-1 h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
