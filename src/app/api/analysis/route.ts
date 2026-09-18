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

    const { year, month } = await req.json()
    if (!year || month === undefined) {
      return NextResponse.json({ error: "Year and month are required" }, { status: 400 })
    }

    // Fetch notes for the specific month
    const startDate = new Date(year, month, 1).toISOString()
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const { data: notes, error: dbError } = await supabase
      .from('notes')
      .select('*')
      .eq('userId', user.id)
      .gte('createdAt', startDate)
      .lte('createdAt', endDate)
      .order('createdAt', { ascending: true })

    if (dbError) throw dbError

    if (!notes || notes.length === 0) {
      return NextResponse.json({
        error: "Not enough notes yet",
        message: "Add more notes during the month and the AI will have more information to analyze."
      }, { status: 404 })
    }

    // Prepare context
    const notesContext = notes.map(n =>
      `[${new Date(n.createdAt).toISOString()}] ${n.title || 'Note'}: ${n.finalContent}`
    ).join("\n\n")

    const prompt = `You are an AI Personal Activity Analyzer.
Analyze the following personal notes from a user for a specific month.

Your task is to extract and categorize their activity based STRICTLY on evidence in the notes.
Do NOT hallucinate or invent events, tasks, or facts.
If there isn't enough evidence to make a conclusion for a section, return an empty array or state "There isn't enough information in your notes to determine this."

You MUST respond with a valid JSON object (no markdown, no code blocks, no backticks) matching this EXACT schema:
{
  "accomplishments": ["string"],
  "intentions": ["string"],
  "pending": ["string"],
  "patterns": ["string"],
  "feedback": {
    "didWell": ["string"],
    "improve": ["string"],
    "recommendations": ["string"]
  }
}

Here are the user's notes for analysis:

${notesContext}`

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
            responseMimeType: "application/json",
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
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}"

    let analysis: any
    try {
      // Strip markdown code fences if Gemini wraps the JSON anyway
      const cleaned = responseText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
      analysis = JSON.parse(cleaned)
    } catch {
      console.error("Failed to parse Gemini JSON response:", responseText)
      throw new Error("AI returned an invalid response. Please try again.")
    }

    return NextResponse.json({
      analysis,
      stats: {
        total: notes.length,
        voice: notes.filter(n => n.inputMethod === "VOICE").length,
        typed: notes.filter(n => n.inputMethod === "TYPED").length,
      }
    })
  } catch (error: any) {
    console.error("AI Analysis Error:", error)
    const message = process.env.NODE_ENV === "development"
      ? `Analysis failed: ${error?.message || String(error)}`
      : "Failed to analyze notes. Please try again later."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
