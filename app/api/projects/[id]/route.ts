import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('projects')
    .update({ ...body, last_updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('projects').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
