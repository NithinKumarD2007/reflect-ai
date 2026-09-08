"use client"

import Link from "next/link"
import Image from "next/image"
import { Mic, PenLine, LayoutDashboard, Sparkles, BrainCircuit, LogOut, User, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: PenLine },
  { href: "/notes/voice", label: "Record", icon: Mic, highlight: true },
  { href: "/analysis", label: "AI Reflect", icon: Sparkles },
  { href: "/chat", label: "Ask AI", icon: BrainCircuit },
]

export function Navbar() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => { authListener.subscription.unsubscribe() }
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="ReflectAI" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-bold text-white tracking-tight text-sm hidden sm:block">ReflectAI</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive(href)
                    ? "bg-white text-black"
                    : highlight
                    ? "text-white border border-white/20 hover:bg-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: user info + sign out / mobile menu */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <User className="h-3.5 w-3.5 text-white/50" />
                  <span className="text-xs text-white/50 max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
          <nav className="max-w-6xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(href)
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            {/* Mobile user info / sign out */}
            <div className="pt-2 border-t border-white/10 mt-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/40">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/8"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
