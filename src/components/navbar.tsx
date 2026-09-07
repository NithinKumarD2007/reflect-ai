import Link from "next/link"
import { Mic, PenLine, LayoutDashboard, BrainCircuit } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-border/40">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            <span className="font-bold inline-block text-gradient">ReflectAI</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link href="/notes/new" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              <PenLine className="h-4 w-4 mr-2" />
              New Note
            </Link>
            <Link href="/notes/voice" className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <Mic className="h-4 w-4 mr-2" />
              Record Voice
            </Link>
            <Link href="/chat" className="flex items-center text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              <BrainCircuit className="h-4 w-4 mr-2" />
              Ask AI
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-end space-x-4">
          <div className="md:hidden flex space-x-4">
            <Link href="/notes/voice" className="text-primary hover:text-primary/80">
              <Mic className="h-5 w-5" />
            </Link>
            <Link href="/notes/new" className="text-foreground/80 hover:text-foreground">
              <PenLine className="h-5 w-5" />
            </Link>
          </div>
          <nav className="flex items-center space-x-1">
             {/* Future: User Profile / Auth Button */}
             <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                <span className="text-xs font-medium">U</span>
             </div>
          </nav>
        </div>
      </div>
    </nav>
  )
}
