import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: "AI is not configured. Please add your GEMINI_API_KEY to the .env file and restart the server."
      }, { status: 500 })
    }

    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const prompt = `You are an AI assistant that enhances raw voice notes.
The user dictates notes that may contain filler words, repeated words, broken sentences, or lack structure.
Your job is to clean up the transcription.

Rules:
1. Fix grammar and punctuation.
2. Remove unnecessary filler words (like "um", "ah", "like", "you know").
3. Organize thoughts clearly, using headings or bullet points ONLY if appropriate.
4. If there are obvious action items, format them nicely.
5. You MUST preserve the user's original meaning and reality.
6. Do NOT invent events, achievements, tasks, or facts.
7. Do NOT convert intentions (e.g., "I need to learn React") into accomplishments (e.g., "Learned React").
8. Maintain the original tone but make it professional and readable.
9. Return ONLY the enhanced note text, nothing else. No preamble, no explanation.

Raw Transcription:
"${text}"

Enhanced Version:`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json()
      console.error("Gemini API error:", JSON.stringify(errBody))
      throw new Error(errBody?.error?.message || `Gemini responded with ${geminiRes.status}`)
    }

    const geminiData = await geminiRes.json()
    const enhancedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    if (!enhancedText) {
      throw new Error("AI returned empty response")
    }

    return NextResponse.json({ enhancedText })
  } catch (error: any) {
    console.error("AI Enhancement Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Enhancement failed: ${error?.message || String(error)}`
      : "Failed to enhance note. Please try again later."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
