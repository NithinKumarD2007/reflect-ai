"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getNotes(query?: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  return await prisma.note.findMany({
    where: {
      userId: session.user.id,
      ...(query ? {
        OR: [
          { title: { contains: query } },
          { finalContent: { contains: query } }
        ]
      } : {})
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export async function saveNote(data: {
  title?: string
  rawContent?: string
  enhancedContent?: string
  finalContent: string
  inputMethod: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title: data.title || "Untitled Note",
      rawContent: data.rawContent,
      enhancedContent: data.enhancedContent,
      finalContent: data.finalContent,
      inputMethod: data.inputMethod,
    }
  })

  revalidatePath("/")
  return note
}

export async function deleteNote(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.note.delete({
    where: {
      id,
      userId: session.user.id
    }
  })

  revalidatePath("/")
}
