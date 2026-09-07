import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "./lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NOTE: PrismaAdapter is not compatible with JWT sessions + Credentials provider.
  // For local dev with Credentials, we use JWT only (no adapter).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const email = credentials.email as string
        const password = credentials.password as string

        let user = await prisma.user.findUnique({
          where: { email }
        })

        // Auto-register for local dev: if user doesn't exist, create one
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10)
          user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
            }
          })
          return { id: user.id, email: user.email, name: user.name }
        }
        
        if (user.password) {
          const isMatch = await bcrypt.compare(password, user.password)
          if (!isMatch) return null
        }

        return { id: user.id, email: user.email, name: user.name }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
