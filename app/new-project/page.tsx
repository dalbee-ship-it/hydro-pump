'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DarkraiHeader } from '@/components/Darkrai'
import Link from 'next/link'

export default function NewProject() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    router.push('/')
  }

  return (
    <main className="min-h-screen">
      <DarkraiHeader />
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-500 hover:text-white text-xs">← BACK</Link>
          <h2 className="text-xs text-gray-500 tracking-widest">NEW PROJECT</h2>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs text-secondary mb-1.5 ui-sans">PROJECT NAME</label>
            <input
              className="input"
              placeholder="e.g. revua 번역 배치 3차"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1.5 ui-sans">DESCRIPTION <span className="text-muted">(optional)</span></label>
            <textarea
              className="input h-20 resize-none"
              placeholder="What are the agents doing?"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? 'CREATING...' : 'CREATE + ASSIGN POKÉMON'}
          </button>
        </form>
      </div>
    </main>
  )
}
