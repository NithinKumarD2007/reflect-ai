import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
You are an AI assistant that enhances raw voice notes. 
The user dictates notes that may contain filler words, repeated words, broken sentences, or lack structure.
Your job is to clean up the transcription.

Rules:
1. Fix grammar and punctuation.
2. Remove unnecessary filler words (like "um", "ah", "like").
3. Organize thoughts clearly, using headings or bullet points ONLY if appropriate.
4. If there are obvious action items, format them nicely.
5. You MUST preserve the user's original meaning and reality.
6. Do NOT invent events, achievements, tasks, or facts.
7. Do NOT convert intentions (e.g., "I need to learn React") into accomplishments (e.g., "Learned React").
8. Maintain the original tone but make it professional and readable.

Raw Transcription:
"${text}"

Enhanced Version:
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const enhancedText = response.text()

    return NextResponse.json({ enhancedText })
  } catch (error) {
    console.error("AI Enhancement Error:", error)
    return NextResponse.json({ error: "Failed to enhance note" }, { status: 500 })
  }
}
