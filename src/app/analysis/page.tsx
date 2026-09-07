"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Target, Clock, RefreshCw, Trophy, AlertTriangle, Sparkles, Activity } from "lucide-react"

type AnalysisResult = {
  accomplishments: string[]
  intentions: string[]
  pending: string[]
  patterns: string[]
  feedback: {
    didWell: string[]
    improve: string[]
    recommendations: string[]
  }
}

export default function AnalysisPage() {
  const [date, setDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<{total: number, voice: number, typed: number} | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const fetchAnalysis = async (year: number, month: number) => {
    setIsLoading(true)
    setError("")
    setAnalysis(null)
    setStats(null)

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to fetch analysis")
      }

      setStats(data.stats)
      setAnalysis(data.analysis)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis(date.getFullYear(), date.getMonth())
  }, [date])

  const handleMonthChange = (val: string) => {
    const newDate = new Date(date)
    newDate.setMonth(parseInt(val))
    setDate(newDate)
  }

  const handleYearChange = (val: string) => {
    const newDate = new Date(date)
    newDate.setFullYear(parseInt(val))
    setDate(newDate)
  }

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Reflection
          </h1>
          <p className="text-muted-foreground mt-2">Discover patterns and insights from your notes.</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={date.getMonth().toString()} 
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            value={date.getFullYear().toString()} 
            onChange={(e) => handleYearChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={() => fetchAnalysis(date.getFullYear(), date.getMonth())}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping blur-xl" />
            <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
          </div>
          <p className="text-muted-foreground animate-pulse">Analyzing your activity...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-xl text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Not enough notes yet</h3>
          <p className="text-destructive/80 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-panel">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">Total Notes</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">Voice Notes</p>
                  <p className="text-3xl font-bold text-primary">{stats.voice}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">Typed Notes</p>
                  <p className="text-3xl font-bold">{stats.typed}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel bg-primary/5 border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Activity className="h-16 w-16" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-sm text-primary font-medium mb-1 uppercase tracking-wider">Productivity</p>
                  <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(stats.total * 5, 100)}%` }} />
                  </div>
                  <p className="text-xs text-primary/70 mt-2 text-right">Lvl {Math.floor(stats.total / 10) + 1}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <Card className="glass-panel h-full">
              <CardHeader className="bg-card/40 pb-4 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-lg text-green-400">
                  <Trophy className="h-5 w-5" />
                  Things You Accomplished
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analysis.accomplishments.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.accomplishments.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0 text-xs mt-0.5">✓</span>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No specific accomplishments found this month.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel h-full">
              <CardHeader className="bg-card/40 pb-4 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-lg text-blue-400">
                  <Target className="h-5 w-5" />
                  Things You Planned
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analysis.intentions.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.intentions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs mt-0.5">→</span>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No specific plans found this month.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel h-full">
              <CardHeader className="bg-card/40 pb-4 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-lg text-orange-400">
                  <Clock className="h-5 w-5" />
                  Still Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analysis.pending.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.pending.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 text-xs mt-0.5">⌛</span>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Nothing apparent pending.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel h-full">
              <CardHeader className="bg-card/40 pb-4 border-b border-border/40">
                <CardTitle className="flex items-center gap-2 text-lg text-purple-400">
                  <TrendingUp className="h-5 w-5" />
                  Recurring Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {analysis.patterns.length > 0 ? (
                  <ul className="space-y-3">
                    {analysis.patterns.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs mt-0.5">↻</span>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No noticeable patterns yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel border-primary/30 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-5">
              <Sparkles className="h-64 w-64 text-primary" />
            </div>
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                Personal Feedback
              </CardTitle>
              <CardDescription>Honest, evidence-based feedback from your AI assistant.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 relative z-10">
              
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-green-400 mb-3">⭐ What You Did Well</h4>
                {analysis.feedback.didWell.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {analysis.feedback.didWell.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not enough data to determine.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3">⚠️ What You Should Improve</h4>
                {analysis.feedback.improve.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {analysis.feedback.improve.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not enough data to determine.</p>
                )}
              </div>

              <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">🤖 AI Recommendations</h4>
                {analysis.feedback.recommendations.length > 0 ? (
                  <ul className="list-decimal pl-5 space-y-2 text-foreground/90">
                    {analysis.feedback.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific recommendations right now.</p>
                )}
              </div>

            </CardContent>
          </Card>

        </div>
      )}
    </div>
  )
}
