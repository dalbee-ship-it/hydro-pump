import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  if (!projectId) return NextResponse.json([], { status: 400 })

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  // { project_id, message, type? }
  const { data, error } = await supabase
    .from('logs')
    .insert({
      project_id: body.project_id,
      message: body.message,
      type: body.type ?? 'system',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
