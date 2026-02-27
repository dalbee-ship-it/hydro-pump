'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { PokemonSprite } from '@/components/PokemonSprite'
import { DarkraiHeader } from '@/components/Darkrai'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Log {
  id: string
  type: 'system' | 'agent' | 'user'
  message: string
  created_at: string
}

interface Project {
  id: string
  name: string
  progress: number
  pokemon_id: number
  status: string
  last_updated_at: string
}

const LOG_COLOR = {
  system: 'text-gray-500',
  agent: 'text-cyan-400',
  user: 'text-white',
}

const LOG_PREFIX = {
  system: '·',
  agent: '▶',
  user: '›',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    // 프로젝트 로드
    supabase.from('projects').select('*').eq('id', id).single()
      .then(({ data }) => setProject(data))

    // 로그 초기 로드
    fetch(`/api/logs?project_id=${id}`)
      .then(r => r.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))

    // Realtime 구독
    const channel = supabase
      .channel(`project-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs', filter: `project_id=eq.${id}` }, payload => {
        setLogs(prev => [...prev, payload.new as Log])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` }, payload => {
        setProject(payload.new as Project)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // 새 로그 오면 스크롤 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  async function sendLog(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !id) return
    setSending(true)
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: id, message: input.trim(), type: 'user' }),
    })
    setInput('')
    setSending(false)
  }

  if (!project) return (
    <main className="min-h-screen bg-gray-950">
      <DarkraiHeader />
      <div className="max-w-2xl mx-auto px-4 py-10 text-gray-600 ui-sans text-sm">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      <DarkraiHeader />
      <div className="max-w-2xl mx-auto px-4 py-5 w-full flex-1 flex flex-col">

        {/* 프로젝트 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/" className="ui-sans text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">← Back</Link>
          <PokemonSprite
            pokemonId={project.pokemon_id}
            progress={project.progress}
            lastUpdatedAt={project.last_updated_at}
            size={44}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base truncate">{project.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full transition-all duration-700" style={{ width: `${project.progress}%` }} />
              </div>
              <span className="ui-sans text-xs text-gray-500 flex-shrink-0">{project.progress}%</span>
            </div>
          </div>
        </div>

        {/* 로그 타임라인 */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-4 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {logs.length === 0 ? (
            <p className="ui-sans text-xs text-gray-700 italic py-8 text-center">아직 기록이 없어요.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex items-start gap-2">
                <span className={`ui-sans text-xs flex-shrink-0 mt-0.5 ${LOG_COLOR[log.type]}`}>
                  {LOG_PREFIX[log.type]}
                </span>
                <span className="ui-sans text-xs text-gray-600 flex-shrink-0 mt-0.5 w-10">{formatTime(log.created_at)}</span>
                <span className={`text-sm leading-snug ${log.type === 'user' ? 'text-white' : log.type === 'agent' ? 'text-cyan-300' : 'text-gray-400'}`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <form onSubmit={sendLog} className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          <input
            className="ui-sans flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600"
            placeholder="메모 또는 명령 남기기..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="ui-sans bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm"
          >
            {sending ? '...' : '→'}
          </button>
        </form>
      </div>
    </main>
  )
}
