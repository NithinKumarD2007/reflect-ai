"use client"

import { useState } from "react"
import { BrainCircuit, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { login, signup } from "./actions"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleSubmit = () => setLoading(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4 ring-1 ring-indigo-500/30">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome to ReflectAI</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            Your AI-powered voice notes and personal activity analyzer.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-800/60 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "signin"
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "signup"
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Sign In Form */}
        {tab === "signin" && (
          <form action={login} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email Address</label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === "signup" && (
          <form action={signup} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email Address</label>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Password</label>
              <Input
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
            <p className="text-xs text-zinc-500 text-center">
              Supabase may send a confirmation email. Check your inbox if login doesn't work immediately.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginForm />
    </Suspense>
  )
}
