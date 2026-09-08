import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.startsWith("YOUR_") || apiKey.startsWith("AQ.")) {
      return NextResponse.json({
        error: "Gemini API key is not configured correctly. Get a valid key from https://aistudio.google.com/app/apikey"
      }, { status: 500 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const mimeType = (formData.get("mimeType") as string) || "audio/webm"

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Limit to 10MB
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio file too large (max 10MB)" }, { status: 413 })
    }

    const audioBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType.split(";")[0], // strip codecs param
          data: base64Audio,
        },
      },
      {
        text: "Transcribe exactly what is spoken in this audio recording. Return only the spoken words, no labels, no timestamps, no explanations. If no speech is detected, return an empty string."
      },
    ])

    const transcription = result.response.text().trim()

    return NextResponse.json({ transcription })
  } catch (error: any) {
    console.error("Transcription Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Transcription failed: ${error?.message || String(error)}`
      : "Failed to transcribe audio. Please check your Gemini API key."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
