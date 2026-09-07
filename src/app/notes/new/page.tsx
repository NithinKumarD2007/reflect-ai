"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveNote } from "@/actions/notes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PenLine, Loader2, Sparkles, Wand2 } from "lucide-react"

export default function NewNotePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [enhancedContent, setEnhancedContent] = useState("")
  const [showComparison, setShowComparison] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleEnhance() {
    if (!content.trim()) return
    setIsEnhancing(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Enhancement failed")
      setEnhancedContent(data.enhancedText)
      setShowComparison(true)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to enhance note")
    } finally {
      setIsEnhancing(false)
    }
  }

  function useEnhanced() {
    setContent(enhancedContent)
    setShowComparison(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await saveNote({
        title,
        rawContent: showComparison ? content : undefined,
        enhancedContent: showComparison ? enhancedContent : undefined,
        finalContent: content,
        inputMethod: "TYPED"
      })
      router.push("/")
    } catch (error) {
      console.error(error)
      setErrorMsg("Failed to save note.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8">
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive border border-destructive/30 p-4 rounded-md mb-6">
          {errorMsg}
        </div>
      )}
      <Card className="glass-panel border-0 shadow-2xl">
        <CardHeader className="border-b border-border/40 pb-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PenLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">New Note</CardTitle>
              <CardDescription>Type your thoughts manually</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                placeholder="Note Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input text-lg font-medium border-0 border-b rounded-none focus-visible:ring-0 px-0 h-12"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => { setContent(e.target.value); setShowComparison(false) }}
                className="glass-input min-h-[300px] text-base resize-y border-0 focus-visible:ring-0 px-0"
                required
              />
            </div>

            {showComparison && (
              <div className="space-y-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-primary">AI Enhanced Version</p>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{enhancedContent}</p>
                <div className="flex gap-2 pt-2">
                  <Button type="button" size="sm" onClick={useEnhanced} className="bg-primary text-primary-foreground">
                    Use Enhanced Version
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowComparison(false)}>
                    Keep Original
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-primary"
                onClick={handleEnhance}
                disabled={isEnhancing || !content.trim()}
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {isEnhancing ? "Enhancing..." : "AI Enhance"}
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => router.push("/")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !content.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Note"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
