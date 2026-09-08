"use client"

import { useState, Suspense } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { login, signup } from "./actions"
import { useSearchParams } from "next/navigation"

function LoginForm() {
  const [tab, setTab] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
          <Image src="/logo.png" alt="ReflectAI" width={48} height={48} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">ReflectAI</h1>
        <p className="text-white/40 text-sm mt-1 text-center max-w-xs">
          AI-powered voice notes and personal activity analysis
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-2xl p-6 shadow-2xl">

        {/* Tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "signin"
                ? "bg-white text-black shadow"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "signup"
                ? "bg-white text-black shadow"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm text-center">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Sign In */}
        {tab === "signin" && (
          <form action={login} onSubmit={() => setLoading(true)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
              <Input
                name="email" type="email"
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/30 h-11"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
              <Input
                name="password" type="password"
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/30 h-11"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>
          </form>
        )}

        {/* Create Account */}
        {tab === "signup" && (
          <form action={signup} onSubmit={() => setLoading(true)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
              <Input
                name="email" type="email"
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/30 h-11"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
              <Input
                name="password" type="password"
                placeholder="Min. 6 characters"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/30 h-11"
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Account
            </button>
            <p className="text-xs text-white/25 text-center pt-1">
              A confirmation email may be sent. Check your inbox.
            </p>
          </form>
        )}
      </div>

      <p className="text-white/20 text-xs mt-6">© 2026 ReflectAI. All rights reserved.</p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  )
}
