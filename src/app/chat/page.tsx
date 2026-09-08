"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BrainCircuit, Send, User, Loader2, Sparkles, AlertTriangle } from "lucide-react"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm ReflectAI. I can answer questions about your past activity, projects, and intentions based on your notes. What would you like to know?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input
    setInput("")
    setErrorMsg("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const history = messages.slice(1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content
      }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch response")

      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Failed to get an answer from AI.")
      // Remove the user message optimistically added or keep it? We'll keep it and just show error.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)] w-full">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Ask AI</h1>
          <p className="text-xs text-white/40">Chat with your note history</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-3 shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Chat Area */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[85%] animate-in fade-in slide-in-from-bottom-2 ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === "user" 
                  ? "bg-white text-black" 
                  : "bg-purple-500/10 border border-purple-500/20 text-purple-400"
              }`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-white/10 text-white rounded-tr-sm border border-white/10" 
                  : "bg-white/[0.04] text-white/90 rounded-tl-sm border border-white/5"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 sm:gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 mr-auto">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.04] rounded-tl-sm border border-white/5 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                <span className="ml-2 text-white/40 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What did I accomplish this week?"
              className="pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl focus-visible:ring-white/20 text-sm"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 h-8 w-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
      
    </div>
  )
}
