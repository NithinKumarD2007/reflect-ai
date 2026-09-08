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

  if (!user?.id) {
    throw new Error("Unauthorized")
  }

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      userId: user.id,
      title: data.title || "Untitled Note",
      rawContent: data.rawContent || null,
      enhancedContent: data.enhancedContent || null,
      finalContent: data.finalContent,
      inputMethod: data.inputMethod,
      tags: data.tags?.join(",") || null,
      category: data.category || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save note:", error)
    throw new Error("Failed to save note")
  }

  revalidatePath("/notes")
  revalidatePath("/")
  return note
}

export async function getNotes(query?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return []
  }

  let dbQuery = supabase
    .from("notes")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,finalContent.ilike.%${query}%`)
  }

  const { data: notes, error } = await dbQuery

  if (error) {
    console.error("Failed to fetch notes:", error)
    return []
  }

  return notes
}

export async function getNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return null
  }

  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("userId", user.id)
    .single()

  if (error) {
    console.error("Failed to fetch note:", error)
    return null
  }

  return note
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("userId", user.id)

  if (error) {
    console.error("Failed to delete note:", error)
    throw new Error("Failed to delete note")
  }

  revalidatePath("/notes")
  revalidatePath("/")
}
