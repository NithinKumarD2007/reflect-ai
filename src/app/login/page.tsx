import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BrainCircuit } from "lucide-react"
import { login, signup } from "./actions"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4 ring-1 ring-indigo-500/30">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Welcome to ReflectAI</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            Sign in to access your intelligent voice notes and personal activity analysis.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-4">
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

          <div className="pt-2 flex flex-col gap-3">
            <Button formAction={login} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white h-11 text-sm">
              Sign In
            </Button>
            <Button formAction={signup} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white h-11 text-sm">
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
