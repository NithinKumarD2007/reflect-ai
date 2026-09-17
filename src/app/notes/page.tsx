import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getNotes } from "@/actions/notes"
import Link from "next/link"
import { format } from "date-fns"
import { Mic, PenLine, Calendar, Clock, Search, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"

// In Next.js 15 App Router, searchParams is a Promise
export default async function AllNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  
  const resolvedParams = await searchParams
  const query = resolvedParams?.q || ""
  const notes = await getNotes(query)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 w-full">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          All Notes
        </h1>
        
        <form className="relative w-full sm:w-72" method="GET" action="/notes">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            name="q"
            defaultValue={query}
            placeholder="Search notes..." 
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-10 rounded-xl"
          />
        </form>
      </div>

      {/* Note List */}
      {notes.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">{query ? "No notes found matching your search." : "You don't have any notes yet."}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block group">
              <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-lg">
                
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    {note.inputMethod === "VOICE" ? (
                      <Mic className="h-5 w-5 text-primary" />
                    ) : (
                      <PenLine className="h-5 w-5 text-secondary" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-lg text-foreground truncate pr-4">
                        {note.title || "Untitled Note"}
                      </h3>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mb-4">
                      {note.finalContent}
                    </p>
                    
                    <div className="flex items-center text-xs text-muted-foreground gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(note.createdAt), "h:mm a")}
                      </span>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <span className="italic text-muted-foreground/50 ml-auto">Edited</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
