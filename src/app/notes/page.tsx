import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getNotes } from "@/actions/notes"
import Link from "next/link"
import { format } from "date-fns"
import { Mic, PenLine, Calendar, Clock, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="container max-w-screen-md mx-auto px-4 py-8 space-y-8">
      
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">All Notes</h1>
        
        <form className="relative" method="GET" action="/notes">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            name="q"
            defaultValue={query}
            placeholder="Search notes..." 
            className="pl-10 glass-input h-12 text-base"
          />
        </form>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {query ? "No notes found matching your search." : "You don't have any notes yet."}
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {notes.map((note) => (
            <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-card/80 backdrop-blur-sm text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg z-10">
                {note.inputMethod === "VOICE" ? <Mic className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              </div>
              
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel hover:bg-card/60 transition-colors">
                <CardContent className="p-5">
                  <Link href={`/notes/${note.id}`} className="block">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {note.title || "Untitled"}
                      </h3>
                    </div>
                    <p className="text-muted-foreground line-clamp-3 text-sm mb-4">
                      {note.finalContent}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(note.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(note.createdAt), "h:mm a")}
                      </span>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
