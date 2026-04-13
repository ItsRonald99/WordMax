import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddWordForm } from '@/components/AddWordForm'

export default async function AddPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <AddWordForm />
}
