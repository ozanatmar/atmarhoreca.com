'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface Props {
  threadId: string
  contactEmail: string
}

interface PendingFile {
  name: string
  content: string // base64
  mime_type: string
  size: number
}

export default function ReplyComposer({ threadId, contactEmail }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const converted = await Promise.all(
      selected.map(
        (file) =>
          new Promise<PendingFile>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const dataUrl = reader.result as string
              // dataUrl = "data:mime/type;base64,<content>"
              const base64 = dataUrl.split(',')[1]
              resolve({ name: file.name, content: base64, mime_type: file.type || 'application/octet-stream', size: file.size })
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
      )
    )
    setFiles((prev) => [...prev, ...converted])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function send() {
    if (!body.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, body, attachments: files }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Failed to send')
        return
      }
      setBody('')
      setFiles([])
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <p className="text-sm font-semibold text-[#1A1A5E] mb-3">
        Reply to <span className="text-[#6B3D8F]">{contactEmail}</span>
      </p>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        placeholder="Write your reply..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3D8F] resize-y"
      />

      {/* Attachments */}
      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <span className="truncate max-w-[200px]">{f.name}</span>
              <span className="text-gray-400 text-xs">({(f.size / 1024).toFixed(0)} KB)</span>
              <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 ml-1 leading-none">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3">
        <Button onClick={send} disabled={sending || !body.trim()}>
          {sending ? 'Sending...' : 'Send Reply'}
        </Button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-[#6B3D8F] hover:underline"
        >
          Attach files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
