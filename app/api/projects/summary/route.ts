import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, status, progress, due_date, last_updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })

  const projects = data ?? []
  const byStatus = projects.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    total: projects.length,
    by_status: byStatus,
    projects: projects.map(p => ({
      name: p.name,
      status: p.status,
      progress: p.progress,
      due_date: p.due_date,
      last_updated_at: p.last_updated_at,
    })),
  })
}
