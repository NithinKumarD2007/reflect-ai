import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { format } from "date-fns"
import { Calendar, Clock, Mic, PenLine, ArrowLeft, Trash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteNote } from "@/actions/notes"

export default async function NoteDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/signin")

  const note = await prisma.note.findUnique({
    where: {
      id: params.id,
      userId: session.user.id
    }
  })

  if (!note) {
    return (
      <div className="container max-w-screen-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Note not found</h1>
        <Link href="/">
          <Button variant="secondary">Return Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-screen-md mx-auto px-4 py-8 space-y-6">
      
      <div className="flex justify-between items-center">
        <Link href="/notes">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
        </Link>
        <form action={async () => {
          "use server"
          await deleteNote(note.id)
          redirect("/notes")
        }}>
          <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Card className="glass-panel border-0 shadow-2xl">
        <CardHeader className="border-b border-border/40 pb-6 mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-2xl mb-2">{note.title || "Untitled Note"}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(note.createdAt, "MMMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(note.createdAt, "h:mm a")}
                </span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {note.inputMethod === "VOICE" ? (
                <Mic className="h-5 w-5 text-primary" />
              ) : (
                <PenLine className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-lg">
              {note.finalContent}
            </p>
          </div>

          {note.rawContent && note.enhancedContent && (
            <div className="pt-8 border-t border-border/40">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Original Voice Transcription</h3>
              <div className="bg-card/40 p-4 rounded-md border border-white/5 text-muted-foreground text-sm whitespace-pre-wrap">
                {note.rawContent}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
      
    </div>
  )
}
