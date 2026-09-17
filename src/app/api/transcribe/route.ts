import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey === "your-groq-api-key-here") {
      return NextResponse.json({
        error: "Groq API key is not configured. Please add your GROQ_API_KEY to the .env file and restart the server."
      }, { status: 500 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const mimeType = (formData.get("mimeType") as string) || "audio/webm"

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Limit to 25MB (Groq Whisper limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 25MB)" }, { status: 413 })
    }

    const groq = new Groq({ apiKey })

    // Groq Whisper API expects a File object
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    })

    const text = transcription.text?.trim() || ""

    return NextResponse.json({ transcription: text })
  } catch (error: any) {
    console.error("Transcription Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Transcription failed: ${error?.message || String(error)}`
      : "Failed to transcribe audio. Please try again later."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
