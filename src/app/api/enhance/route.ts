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
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json({
        error: "Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file and restart the server."
      }, { status: 500 })
    }

    const { text } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Instantiate inside handler so key is read fresh each request
    const genAI = new GoogleGenerativeAI(apiKey)
    
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
9. Return ONLY the enhanced note text, nothing else.

Raw Transcription:
"${text}"

Enhanced Version:`

    let enhancedText = ""
    let lastError: any = null
    const modelsToTry = ["gemini-1.5-flash", "gemini-3.7-flash"]

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        enhancedText = result.response.text()
        break // Success, break out of loop
      } catch (error: any) {
        lastError = error
        console.warn(`Model ${modelName} failed:`, error.message)
        // If it's the last model, it will throw below
      }
    }

    if (!enhancedText) {
      throw lastError
    }

    return NextResponse.json({ enhancedText })
  } catch (error: any) {
    console.error("AI Enhancement Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Enhancement failed: ${error?.message || String(error)}`
      : "Failed to enhance note. Please check your Gemini API key."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
