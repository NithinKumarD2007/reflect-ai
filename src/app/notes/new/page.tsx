"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveNote } from "@/actions/notes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PenLine, Loader2, Sparkles } from "lucide-react"

export default function NewNotePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await saveNote({
        title,
        finalContent: content,
        inputMethod: "TYPED"
      })
      router.push("/")
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8">
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
                onChange={(e) => setContent(e.target.value)}
                className="glass-input min-h-[300px] text-base resize-y border-0 focus-visible:ring-0 px-0"
                required
              />
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-border/40">
              <Button type="button" variant="ghost" className="text-muted-foreground">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Enhance
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
