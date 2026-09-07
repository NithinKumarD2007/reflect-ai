import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // For local development, if user doesn't exist, we will create one for simplicity
        if (!user) {
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10)
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email as string,
              password: hashedPassword,
            }
          })
          return newUser
        }
        
        if (user.password) {
          const isMatch = await bcrypt.compare(credentials.password as string, user.password)
          if (!isMatch) return null
        }

        return user
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
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
