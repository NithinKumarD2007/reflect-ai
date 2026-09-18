import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getNotes } from "@/actions/notes"
import Link from "next/link"
import { format } from "date-fns"
import {
  Mic, PenLine, Sparkles, Calendar, Clock, FileText,
  BrainCircuit, ChevronRight, TrendingUp, Zap, ArrowUpRight,
  BarChart3, Activity, Plus
} from "lucide-react"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getWordCount(text: string): number {
  return text?.trim().split(/\s+/).filter(Boolean).length || 0
}

function getDaysSinceLastNote(notes: any[]): number {
  if (notes.length === 0) return -1
  const lastNote = new Date(notes[0].createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - lastNote.getTime()) / (1000 * 60 * 60 * 24))
}

function getStreak(notes: any[]): number {
  if (notes.length === 0) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const uniqueDays = new Set(
    notes.map(n => {
      const d = new Date(n.createdAt)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  let streak = 0
  const oneDay = 86400000
  let checkDate = today.getTime()

  // If no note today, start from yesterday
  if (!uniqueDays.has(checkDate)) {
    checkDate -= oneDay
  }

  while (uniqueDays.has(checkDate)) {
    streak++
    checkDate -= oneDay
  }

  return streak
}

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
  const totalWords = notes.reduce((sum, n) => sum + getWordCount(n.finalContent), 0)
  const streak = getStreak(notes)
  const daysSinceLast = getDaysSinceLastNote(notes)

  // Notes from last 7 days for activity indicator
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const thisWeekNotes = notes.filter(n => new Date(n.createdAt) >= weekAgo).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full">

      {/* ── Hero Greeting ── */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-primary/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/8 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {getGreeting()}, <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{username}</span>
            </h1>
            <p className="text-white/40 text-sm mt-2 max-w-md">
              {notes.length === 0
                ? "Start capturing your thoughts. AI does the rest."
                : daysSinceLast === 0
                  ? "You're on fire today! Keep capturing your thoughts."
                  : daysSinceLast === 1
                    ? "Welcome back! Ready to capture today's ideas?"
                    : `It's been ${daysSinceLast} days since your last note. Let's catch up!`
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Link href="/notes/new" aria-label="Create new note">
              <button className="flex items-center justify-center h-10 w-10 bg-primary/20 hover:bg-primary/30 text-primary-foreground rounded-full transition-all">
                <Plus className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Notes */}
        <div className="group relative bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all duration-300 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{notes.length}</div>
          <div className="text-xs text-white/40 mt-1">Total Notes</div>
        </div>

        {/* Voice Notes */}
        <div className="group relative bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all duration-300 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Mic className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{voiceNotes}</div>
          <div className="text-xs text-white/40 mt-1">Voice Notes</div>
        </div>

        {/* Written */}
        <div className="group relative bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all duration-300 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <PenLine className="h-4 w-4 text-violet-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{typedNotes}</div>
          <div className="text-xs text-white/40 mt-1">Written</div>
        </div>

        {/* Streak / Words */}
        <div className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 sm:p-5 hover:from-amber-500/15 hover:to-orange-500/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {streak > 0 ? streak : totalWords.toLocaleString()}
          </div>
          <div className="text-xs text-amber-300/60 mt-1">
            {streak > 0 ? `Day Streak 🔥` : "Total Words"}
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column: Recent Notes ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Removed duplicate quick action cards */}

          {/* Recent Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/40" />
                Recent Notes
              </h2>
              <Link href="/notes" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-white/40 italic py-4">No notes yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.slice(0, 5).map((note) => {
                  const wordCount = getWordCount(note.finalContent)
                  return (
                    <Link key={note.id} href={`/notes/${note.id}`} className="block group">
                      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-8 w-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0">
                            {note.inputMethod === "VOICE"
                              ? <Mic className="h-3.5 w-3.5 text-purple-400/70" />
                              : <PenLine className="h-3.5 w-3.5 text-sky-400/70" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate group-hover:text-white/90">
                              {note.title || "Untitled Note"}
                            </p>
                            <p className="text-xs text-white/35 line-clamp-2 mt-0.5 leading-relaxed">{note.finalContent}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-white/25">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(note.createdAt), "MMM d")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(note.createdAt), "h:mm a")}
                              </span>
                              <span className="text-white/20">{wordCount} words</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-white/40 shrink-0 mt-1 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="space-y-5">

          {/* Weekly Activity */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white">This Week</h3>
            </div>
            <div className="flex items-end gap-1 h-16 mb-3">
              {(() => {
                const days = []
                const today = new Date()
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(today)
                  d.setDate(d.getDate() - i)
                  d.setHours(0, 0, 0, 0)
                  const count = notes.filter(n => {
                    const nd = new Date(n.createdAt)
                    nd.setHours(0, 0, 0, 0)
                    return nd.getTime() === d.getTime()
                  }).length
                  days.push({ date: d, count })
                }
                const maxCount = Math.max(...days.map(d => d.count), 1)
                return days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ${
                        day.count > 0
                          ? "bg-gradient-to-t from-purple-500/60 to-purple-400/40"
                          : "bg-white/8"
                      }`}
                      style={{ height: `${Math.max((day.count / maxCount) * 100, 12)}%` }}
                    />
                    <span className="text-[10px] text-white/25">
                      {format(day.date, "EEE").charAt(0)}
                    </span>
                  </div>
                ))
              })()}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">{thisWeekNotes} notes this week</span>
              {thisWeekNotes > 0 && (
                <span className="flex items-center gap-1 text-emerald-400/70">
                  <Activity className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: "/analysis", icon: Sparkles, label: "AI Monthly Reflect", desc: "Analyze patterns & insights", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                { href: "/chat", icon: BrainCircuit, label: "Ask Your Notes", desc: "Chat with your history", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                { href: "/notes", icon: FileText, label: "Browse All Notes", desc: `${notes.length} notes total`, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
              ].map(({ href, icon: Icon, label, desc, color, bg, border }) => (
                <Link key={href} href={href} className="block group">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg ${bg} border ${border} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</p>
                        <p className="text-xs text-white/30">{desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-white/40 shrink-0 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Insights Card */}
          {notes.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Quick Insights</h3>
              </div>
              <div className="space-y-3 text-xs text-white/40">
                <div className="flex justify-between items-center">
                  <span>Avg. note length</span>
                  <span className="text-white/60 font-medium">
                    {notes.length > 0 ? Math.round(totalWords / notes.length) : 0} words
                  </span>
                </div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between items-center">
                  <span>Voice vs Written</span>
                  <span className="text-white/60 font-medium">
                    {notes.length > 0 ? Math.round((voiceNotes / notes.length) * 100) : 0}% voice
                  </span>
                </div>
                <div className="h-px bg-white/8" />
                <div className="flex justify-between items-center">
                  <span>Total words captured</span>
                  <span className="text-white/60 font-medium">{totalWords.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
