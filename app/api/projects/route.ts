import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { assignRandomPokemon } from '@/lib/pokemon'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, tasks(*)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { name, description } = await req.json()

  // archived 제외하고 활성 프로젝트의 pokemon_id만 중복 방지
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('pokemon_id')
    .in('status', ['waiting', 'active', 'issue', 'done'])

  const usedIds = activeProjects?.map((p: { pokemon_id: number }) => p.pokemon_id) ?? []
  const pokemonId = await assignRandomPokemon(usedIds)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name, description, pokemon_id: pokemonId, status: 'waiting' })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(project)
}
