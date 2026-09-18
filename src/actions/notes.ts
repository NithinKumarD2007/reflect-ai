"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function saveNote(data: {
  title?: string
  rawContent?: string
  enhancedContent?: string
  finalContent: string
  inputMethod: "VOICE" | "TYPED"
  tags?: string[]
  category?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) throw new Error("Unauthorized")

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      userId: user.id,
      title: data.title?.trim() || "Untitled Note",
      rawContent: data.rawContent || null,
      enhancedContent: data.enhancedContent || null,
      finalContent: data.finalContent?.trim() || data.rawContent?.trim() || "Empty note",
      inputMethod: data.inputMethod,
      tags: data.tags?.join(",") || null,
      category: data.category || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save note:", JSON.stringify(error))
    throw new Error(error.message || "Failed to save note")
  }

  revalidatePath("/notes")
  revalidatePath("/")
  return note
}

export async function updateNote(id: string, data: {
  title?: string
  finalContent: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) throw new Error("Unauthorized")

  // Verify ownership
  const { data: existing } = await supabase
    .from("notes")
    .select("id, userId")
    .eq("id", id)
    .eq("userId", user.id)
    .single()

  if (!existing) throw new Error("Note not found or access denied")

  const { data: note, error } = await supabase
    .from("notes")
    .update({
      title: data.title?.trim() || "Untitled Note",
      finalContent: data.finalContent?.trim() || "Empty note",
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("userId", user.id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update note:", JSON.stringify(error))
    throw new Error(error.message || "Failed to update note")
  }

  revalidatePath("/notes")
  revalidatePath(`/notes/${id}`)
  revalidatePath("/")
  return note
}

export async function getNotes(query?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) return []

  let dbQuery = supabase
    .from("notes")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })

  if (query?.trim()) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,finalContent.ilike.%${query}%`)
  }

  const { data: notes, error } = await dbQuery

  if (error) {
    console.error("Failed to fetch notes:", JSON.stringify(error))
    return []
  }

  return notes ?? []
}

export async function getNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) return null

  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("userId", user.id)
    .single()

  if (error) {
    console.error("Failed to fetch note:", JSON.stringify(error))
    return null
  }

  return note
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("userId", user.id)

  if (error) {
    console.error("Failed to delete note:", JSON.stringify(error))
    throw new Error(error.message || "Failed to delete note")
  }

  revalidatePath("/notes")
  revalidatePath("/")
}
