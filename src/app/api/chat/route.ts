import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { getNotes } from "@/actions/notes"

// Vercel edge runtime timeout is sometimes 10s on hobby plan, 
// but we'll try to keep it fast by sending limited context.
export const maxDuration = 30 // Allow up to 30s for the function to execute if supported

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.startsWith("YOUR_") || apiKey.startsWith("AQ.")) {
      return NextResponse.json({
        error: "AI is not configured. Please check your Gemini API key."
      }, { status: 500 })
    }

    // Get all user's notes for context
    // In a real app with many notes, you'd use RAG (vector embeddings) here.
    // For this prototype, we'll fetch up to 20 most recent notes to avoid token limits.
    const allNotes = await getNotes()
    const recentNotes = allNotes.slice(0, 20)

    const contextNotes = recentNotes.map(n => 
      `Date: ${new Date(n.createdAt).toLocaleDateString()}\nTitle: ${n.title || 'Untitled'}\nContent: ${n.finalContent}`
    ).join("\n\n---\n\n")

    const systemPrompt = `You are ReflectAI, an intelligent assistant designed to help the user understand their past thoughts, accomplishments, and plans based ONLY on their personal notes.
    
Here are the user's recent notes:
${contextNotes || "No notes available yet."}

Instructions:
1. Answer the user's question based ONLY on the notes provided above.
2. If the user asks about something not in the notes, say "I don't see any information about that in your recent notes."
3. Never invent or hallucinate activities, accomplishments, or intentions. 
4. Distinguish between things the user *planned* to do (intentions) and things they *actually* did (accomplishments).
5. Be concise, supportive, and direct.`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    })

    // Format history for Gemini
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
      }
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    return NextResponse.json({ response: responseText })
    
  } catch (error: any) {
    console.error("Chat Error:", error)
    // Avoid returning internal stack traces to the client
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message 
      : "Failed to communicate with AI model. Please try again later."
      
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
