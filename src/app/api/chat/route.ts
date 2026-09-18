import { NextResponse } from "next/server"
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

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: "AI is not configured. Please add your GEMINI_API_KEY to the .env file."
      }, { status: 500 })
    }

    // Get all user's notes for context (most recent 20 to avoid token limits)
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

    // Build the Gemini contents array: system context + conversation history + new message
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

    // Gemini doesn't have a "system" role — prepend it as first user turn
    contents.push({ role: "user", parts: [{ text: systemPrompt }] })
    contents.push({ role: "model", parts: [{ text: "Understood. I'll answer based only on the notes provided." }] })

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }],
        })
      }
    }

    // Add current user message
    contents.push({ role: "user", parts: [{ text: message }] })

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 600,
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
    const responseText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""

    return NextResponse.json({ response: responseText })

  } catch (error: any) {
    console.error("Chat Error:", error)
    const errorMessage = process.env.NODE_ENV === "development"
      ? error.message
      : "Failed to communicate with AI model. Please try again later."

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
