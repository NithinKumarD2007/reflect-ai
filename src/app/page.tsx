import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getNotes } from "@/actions/notes"
import Link from "next/link"
import { format } from "date-fns"
import { Mic, PenLine, Sparkles, Calendar, Clock, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    redirect("/api/auth/signin")
  }

  const notes = await getNotes()

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{session.user?.name ? `, ${session.user.name}` : ""}</h1>
          <p className="text-muted-foreground mt-1">Capture your thoughts, we'll do the rest.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/notes/voice">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Mic className="mr-2 h-4 w-4" />
              Record Voice
            </Button>
          </Link>
          <Link href="/notes/new">
            <Button variant="secondary" className="shadow-lg hover:scale-105 transition-all">
              <PenLine className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Notes
            </h2>
            <Link href="/notes" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              View all
            </Link>
          </div>
          
          {notes.length === 0 ? (
            <Card className="glass-panel border-dashed border-2 bg-transparent text-center p-12">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Your thoughts start here.</p>
                <p className="text-muted-foreground mt-1 mb-6">Record a quick voice note or write something down.</p>
                <Link href="/notes/voice">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {notes.slice(0, 5).map((note) => (
                <Card key={note.id} className="glass-panel hover:bg-card/60 transition-colors group">
                  <CardContent className="p-5">
                    <Link href={`/notes/${note.id}`} className="block">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {note.title || "Untitled"}
                        </h3>
                        {note.inputMethod === "VOICE" ? (
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <PenLine className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-muted-foreground line-clamp-2 text-sm mb-4">
                        {note.finalContent}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(note.createdAt, "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(note.createdAt, "h:mm a")}
                        </span>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="glass-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BrainCircuit className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
              <CardDescription>Reflect on your past activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notes this month</span>
                  <span className="font-medium text-foreground">{notes.length}</span>
                </div>
                {/* Progress bar visual for gaming aesthetic */}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(notes.length * 5, 100)}%` }} />
                </div>
              </div>
              <Link href="/analysis" className="block mt-4">
                <Button variant="outline" className="w-full justify-between group">
                  View Monthly Insight
                  <Sparkles className="h-4 w-4 group-hover:text-primary transition-colors" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
    </div>
  )
}
