"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Send, User, Loader2, Sparkles } from "lucide-react"

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
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      // Create history array without the first greeting message to save tokens if needed
      // Or send full history
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
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error while trying to answer that." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8 flex flex-col h-[calc(100vh-4rem)]">
      
      <div className="flex items-center gap-3 mb-6">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Ask AI</h1>
          <p className="text-sm text-muted-foreground">Ask questions about your notes</p>
        </div>
      </div>

      <Card className="glass-panel flex-1 flex flex-col overflow-hidden relative shadow-2xl">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-primary/20 text-primary" : "bg-card border border-border shadow-md"}`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "glass-panel rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 mr-auto">
              <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center bg-card border border-border shadow-md">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl glass-panel rounded-tl-sm flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t border-border/40 bg-card/60 backdrop-blur-sm relative z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., What did I accomplish this week?"
              className="pr-12 glass-input h-14 rounded-full text-base"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 h-10 w-10 rounded-full shadow-lg hover:scale-105 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      
    </div>
  )
}
