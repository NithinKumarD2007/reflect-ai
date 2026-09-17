import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"
import { getNotes } from "@/actions/notes"

// Allow up to 30s for the function to execute if supported
export const maxDuration = 30

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

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey || apiKey === "your-groq-api-key-here") {
      return NextResponse.json({
        error: "AI is not configured. Please add your GROQ_API_KEY to the .env file."
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

    const groq = new Groq({ apiKey })

    // Build messages array: system + history + new user message
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt }
    ]

    // Format history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.content,
        })
      }
    }

    messages.push({ role: "user", content: message })

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4,
      max_tokens: 500,
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ""

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
