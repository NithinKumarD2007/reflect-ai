"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateNote } from "@/actions/notes"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

interface EditNoteClientProps {
  note: {
    id: string
    title: string | null
    finalContent: string
    rawContent: string | null
    inputMethod: string
  }
}

export default function EditNoteClient({ note }: EditNoteClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(note.title || "")
  const [content, setContent] = useState(note.finalContent || "")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(note.title || "")
    setContent(note.finalContent || "")
  }, [note])

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSaving(true)
    setError("")
    try {
      await updateNote(note.id, {
        title: title.trim(),
        finalContent: content.trim(),
      })
      setSuccess(true)
      setTimeout(() => {
        router.refresh()
        router.push(`/notes/${note.id}`)
      }, 800)
    } catch (err: any) {
      setError(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/notes/${note.id}`}>
          <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-lg font-semibold text-foreground">Edit Note</h1>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-950/40 border border-green-800/50 text-green-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
          <Save className="h-4 w-4" /> Saved! Redirecting...
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (optional)"
            className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note content..."
            className="bg-white/5 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary min-h-[300px] sm:min-h-[400px] resize-y text-sm leading-relaxed"
            required
          />
        </div>

        {/* Original transcript (read-only, preserved) */}
        {note.rawContent && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              Original Transcription (preserved, not editable)
            </p>
            <p className="text-foreground/70 text-sm leading-relaxed">{note.rawContent}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href={`/notes/${note.id}`} className="flex-1">
            <button
              type="button"
              className="w-full h-11 border border-border text-muted-foreground text-sm font-medium rounded-xl hover:bg-muted transition-all"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSaving || !content.trim() || success}
            className="flex-1 h-11 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
