import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getNotes } from "@/actions/notes"
import Link from "next/link"
import { format } from "date-fns"
import { Mic, PenLine, Sparkles, Calendar, Clock, FileText, BrainCircuit, ChevronRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const notes = await getNotes()
  const voiceNotes = notes.filter(n => n.inputMethod === "VOICE").length
  const typedNotes = notes.filter(n => n.inputMethod === "TYPED").length
  const username = user.email?.split("@")[0] ?? "there"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full">

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Good to see you, <span className="text-white/60">{username}</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Capture your thoughts. AI does the rest.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/notes/voice">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Record Voice</span>
              <span className="sm:hidden">Record</span>
            </button>
          </Link>
          <Link href="/notes/new">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/8 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/15 transition-all">
              <PenLine className="h-4 w-4" />
              <span className="hidden sm:inline">New Note</span>
              <span className="sm:hidden">Write</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Notes", value: notes.length, icon: FileText },
          { label: "Voice Notes", value: voiceNotes, icon: Mic },
          { label: "Written", value: typedNotes, icon: PenLine },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <Icon className="h-4 w-4 text-white/30" />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-white/40">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-white/40" />
              Recent Notes
            </h2>
            <Link href="/notes" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {notes.length === 0 ? (
            <div className="bg-white/[0.03] border border-dashed border-white/15 rounded-2xl p-8 sm:p-10 text-center">
              <FileText className="h-10 w-10 text-white/10 mx-auto mb-4" />
              <p className="text-white/60 text-base font-medium">Your recent notes will appear here</p>
              <p className="text-white/30 text-sm mt-2 max-w-sm mx-auto">
                You haven't created any notes yet. Record your voice or type a new note to start building your AI-powered knowledge base.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <Link href="/notes/voice">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all w-full sm:w-auto">
                    <Mic className="h-4 w-4" /> Record Voice
                  </button>
                </Link>
                <Link href="/notes/new">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all w-full sm:w-auto">
                    <PenLine className="h-4 w-4" /> Type a Note
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.slice(0, 5).map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`} className="block group">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-7 w-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                        {note.inputMethod === "VOICE"
                          ? <Mic className="h-3.5 w-3.5 text-white/50" />
                          : <PenLine className="h-3.5 w-3.5 text-white/50" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white truncate group-hover:text-white/90">
                          {note.title || "Untitled Note"}
                        </p>
                        <p className="text-xs text-white/35 line-clamp-1 mt-0.5">{note.finalContent}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/25">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(note.createdAt), "MMM d")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(note.createdAt), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 shrink-0 mt-1 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/analysis", icon: Sparkles, label: "AI Monthly Reflect", desc: "Analyze your activity" },
              { href: "/chat", icon: BrainCircuit, label: "Ask Your Notes", desc: "Chat with your history" },
              { href: "/notes", icon: FileText, label: "Browse All Notes", desc: `${notes.length} notes total` },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href} className="block group">
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 group-hover:text-white">{label}</p>
                      <p className="text-xs text-white/30">{desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
