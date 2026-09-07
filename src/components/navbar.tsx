"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Mic, PenLine, LayoutDashboard, BrainCircuit, Sparkles, LogOut, User, Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: PenLine },
  { href: "/notes/voice", label: "Record", icon: Mic, highlight: true },
  { href: "/analysis", label: "AI Reflect", icon: Sparkles },
  { href: "/chat", label: "Ask AI", icon: BrainCircuit },
]

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-border/40">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <span className="font-bold text-gradient hidden sm:inline-block">ReflectAI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon, highlight }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                highlight
                  ? "text-primary hover:text-primary/80 hover:bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground max-w-[120px] truncate">
                  {session.user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button size="sm" variant="outline">Sign In</Button>
            </Link>
          )}

          {/* Mobile: quick actions */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/notes/voice" className="text-primary hover:text-primary/80">
              <Mic className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-foreground/70 hover:text-foreground p-1"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden glass-panel border-t border-border/40 px-4 py-4 space-y-1">
          {navLinks.map(({ href, label, icon: Icon, highlight }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full ${
                highlight
                  ? "text-primary hover:bg-primary/10"
                  : "text-foreground/70 hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 w-full transition-colors mt-2 border-t border-border/40 pt-4"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
