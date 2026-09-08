import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getNote } from "@/actions/notes"
import EditNoteClient from "./EditNoteClient"

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) redirect("/login")

  const { id } = await params
  const note = await getNote(id)

  if (!note) notFound()

  return <EditNoteClient note={note} />
}
