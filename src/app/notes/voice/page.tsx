"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { saveNote } from "@/actions/notes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mic, Square, Loader2, Sparkles, Wand2, RefreshCw } from "lucide-react"

// Types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type UIState = "READY" | "RECORDING" | "ENHANCING" | "REVIEW"

export default function VoiceNotePage() {
  const router = useRouter()
  const [uiState, setUiState] = useState<UIState>("READY")
  const [rawText, setRawText] = useState("")
  const [interimText, setInterimText] = useState("")
  const [enhancedText, setEnhancedText] = useState("")
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " "
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }
          
          if (finalTranscript) {
            setRawText((prev) => prev + finalTranscript)
          }
          setInterimText(interimTranscript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setErrorMsg("Speech recognition error: " + event.error)
          stopRecording()
        }
      } else {
        setErrorMsg("Your browser does not support Speech Recognition. Try Chrome or Edge.")
      }
    }
  }, [])

  const startRecording = () => {
    setRawText("")
    setInterimText("")
    setErrorMsg("")
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setUiState("RECORDING")
      } catch (err) {
        console.error(err)
        setErrorMsg("Could not start microphone.")
      }
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setInterimText("")
    if (rawText.trim() || interimText.trim()) {
      enhanceNote(rawText + interimText)
    } else {
      setUiState("READY")
    }
  }

  const enhanceNote = async (textToEnhance: string) => {
    setUiState("ENHANCING")
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEnhance })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Enhancement failed")
      
      setEnhancedText(data.enhancedText)
      setUiState("REVIEW")
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Failed to connect to AI")
      // Still go to review mode so they don't lose raw text
      setEnhancedText(textToEnhance)
      setUiState("REVIEW")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enhancedText.trim()) return

    setIsSaving(true)
    try {
      await saveNote({
        title,
        rawContent: rawText,
        enhancedContent: enhancedText,
        finalContent: enhancedText, // What the user edited in the textarea
        inputMethod: "VOICE"
      })
      router.push("/")
    } catch (error) {
      console.error(error)
      setErrorMsg("Failed to save note.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container max-w-screen-lg mx-auto px-4 py-8">
      
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive border border-destructive/30 p-4 rounded-md mb-6">
          {errorMsg}
        </div>
      )}

      {/* State: Ready / Recording */}
      {(uiState === "READY" || uiState === "RECORDING") && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Capture your thoughts</h1>
            <p className="text-xl text-muted-foreground">Speak naturally. We'll structure it later.</p>
          </div>
          
          <div className="relative flex items-center justify-center">
            {uiState === "RECORDING" && (
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            )}
            <button
              onClick={uiState === "RECORDING" ? stopRecording : startRecording}
              className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
                uiState === "RECORDING" 
                  ? "bg-destructive hover:bg-destructive/90 scale-110" 
                  : "bg-primary hover:bg-primary/90 hover:scale-105"
              }`}
            >
              {uiState === "RECORDING" ? (
                <Square className="h-10 w-10 text-destructive-foreground fill-current" />
              ) : (
                <Mic className="h-12 w-12 text-primary-foreground" />
              )}
            </button>
          </div>

          <div className="w-full max-w-2xl h-48 p-6 glass-panel rounded-xl overflow-y-auto">
            {!rawText && !interimText ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/50 italic">
                {uiState === "RECORDING" ? "Listening..." : "Waiting to record..."}
              </div>
            ) : (
              <p className="text-lg leading-relaxed">
                <span className="text-foreground">{rawText}</span>
                <span className="text-muted-foreground">{interimText}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* State: Enhancing */}
      {uiState === "ENHANCING" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-xl" />
            <div className="h-24 w-24 rounded-full glass-panel flex items-center justify-center relative z-10 shadow-2xl">
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gradient">Enhancing your note...</h2>
            <p className="text-muted-foreground">Structuring thoughts and fixing grammar</p>
          </div>
        </div>
      )}

      {/* State: Review */}
      {uiState === "REVIEW" && (
        <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 border-b border-border/40 pb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Wand2 className="h-8 w-8 text-primary" />
                Review & Save
              </h1>
              <p className="text-muted-foreground mt-2">Edit your AI enhanced note before saving.</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setUiState("READY")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button type="submit" disabled={isSaving || !enhancedText.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Note"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Give your note a title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input text-xl font-semibold border-0 border-b rounded-none focus-visible:ring-0 px-0 h-14"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <Card className="glass-panel border-0 shadow-lg flex flex-col">
              <CardHeader className="bg-secondary/30 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  Raw Transcription
                </CardTitle>
                <CardDescription>Exactly what we heard.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <Textarea
                  value={rawText}
                  readOnly
                  className="w-full h-full min-h-[400px] resize-none border-0 bg-transparent focus-visible:ring-0 text-muted-foreground p-6 rounded-none"
                />
              </CardContent>
            </Card>

            <Card className="glass-panel border-primary/20 shadow-2xl shadow-primary/5 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles className="h-32 w-32" />
              </div>
              <CardHeader className="bg-primary/5 pb-4 relative z-10 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Wand2 className="h-4 w-4" />
                  Enhanced Note
                </CardTitle>
                <CardDescription>Feel free to make any final edits.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative z-10">
                <Textarea
                  value={enhancedText}
                  onChange={(e) => setEnhancedText(e.target.value)}
                  className="w-full h-full min-h-[400px] resize-y border-0 bg-transparent focus-visible:ring-0 text-foreground p-6 rounded-none text-base leading-relaxed"
                  required
                />
              </CardContent>
            </Card>
          </div>
        </form>
      )}

    </div>
  )
}
