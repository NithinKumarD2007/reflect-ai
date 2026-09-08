import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json({
        error: "Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file and restart the server."
      }, { status: 500 })
    }

    const { message, history } = await req.json()
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Fetch the last 100 notes as context (or maybe all notes if within token limits)
    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 200
    })

    const notesContext = notes.map(n => `[${n.createdAt.toISOString()}] ${n.title || 'Note'}: ${n.finalContent}`).join("\n\n")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const systemInstruction = `
You are ReflectAI Assistant, an AI that helps the user answer questions about their past activity based ONLY on their notes.
Here is the user's entire recent note history:
---
${notesContext}
---
Rules:
1. Answer the user's question accurately using ONLY the information provided in the notes above.
2. If the answer cannot be found in the notes, say "I couldn't find information about that in your notes."
3. Do NOT hallucinate or invent facts.
4. Keep the response concise, helpful, and conversational.
`

    // Convert history format to Gemini format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "SYSTEM INSTRUCTION: " + systemInstruction }] },
        { role: "model", parts: [{ text: "Understood. I will answer based ONLY on the provided notes." }] },
        ...formattedHistory
      ],
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error("AI Chat Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Chat failed: ${error?.message || String(error)}`
      : "Failed to process chat. Please check your Gemini API key."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
