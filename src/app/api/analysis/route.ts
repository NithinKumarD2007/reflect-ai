import { NextResponse } from "next/response"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { year, month } = await req.json()
    if (!year || month === undefined) {
      return NextResponse.json({ error: "Year and month are required" }, { status: 400 })
    }

    // Fetch notes for the specific month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    if (notes.length === 0) {
      return NextResponse.json({ 
        error: "Not enough notes yet", 
        message: "Add more notes during the month and the AI will have more information to analyze." 
      }, { status: 404 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Prepare context
    const notesContext = notes.map(n => `[${n.createdAt.toISOString()}] ${n.title || 'Note'}: ${n.finalContent}`).join("\n\n")

    const prompt = `
You are an AI Personal Activity Analyzer.
Analyze the following personal notes from a user for a specific month.

Your task is to extract and categorize their activity based STRICTLY on evidence in the notes.
Do NOT hallucinate or invent events, tasks, or facts.
If there isn't enough evidence to make a conclusion for a section, return an empty array or state "There isn't enough information in your notes to determine this."

Respond with a raw JSON object (without markdown code blocks) matching this exact schema:
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

Here are the notes:
${notesContext}
`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Clean up potential markdown blocks
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
    const analysis = JSON.parse(jsonString)

    return NextResponse.json({ 
      analysis,
      stats: {
        total: notes.length,
        voice: notes.filter(n => n.inputMethod === "VOICE").length,
        typed: notes.filter(n => n.inputMethod === "TYPED").length,
      }
    })
  } catch (error) {
    console.error("AI Analysis Error:", error)
    return NextResponse.json({ error: "Failed to analyze notes" }, { status: 500 })
  }
}
