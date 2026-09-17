import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { format } from "date-fns"
import { Calendar, Clock, Mic, PenLine, ArrowLeft, Trash, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteNote, getNote } from "@/actions/notes"

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) redirect("/login")

  const { id } = await params
  const note = await getNote(id)

  if (!note) notFound()

  async function handleDelete() {
    "use server"
    await deleteNote(note!.id)
    redirect("/notes")
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 w-full">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/notes">
          <button className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/notes/${note.id}/edit`}>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary hover:text-secondary-foreground hover:bg-secondary/20 transition-colors text-xs font-medium">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          </Link>
          <form action={handleDelete}>
            <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors text-xs font-medium border border-red-500/20">
              <Trash className="h-3.5 w-3.5" />
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Note Content */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Note Header */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                {note.title || "Untitled Note"}
              </h1>
              <div className="flex items-center text-xs text-white/40 gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(note.createdAt), "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(note.createdAt), "h:mm a")}
                </span>
                {note.updatedAt && note.updatedAt !== note.createdAt && (
                  <span className="flex items-center gap-1.5 text-white/25 italic">
                    (Edited)
                  </span>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              {note.inputMethod === "VOICE" ? (
                <Mic className="h-5 w-5 text-white/60" />
              ) : (
                <PenLine className="h-5 w-5 text-white/60" />
              )}
            </div>
          </div>
        </div>

        {/* Final Text */}
        <div className="p-6">
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-base text-white/90">
              {note.finalContent}
            </p>
          </div>
        </div>

        {/* Original Transcript (if exists) */}
        {note.rawContent && note.inputMethod === "VOICE" && (
          <div className="p-6 border-t border-white/8 bg-black/20">
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Mic className="h-3.5 w-3.5" /> Original Transcript
            </h3>
            <div className="bg-muted border border-border p-4 rounded-xl text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {note.rawContent}
            </div>
          </div>
        )}
      </div>
      
    </div>
  )
}
