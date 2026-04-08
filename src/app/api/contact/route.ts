import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED_INBOXES = ['returns', 'privacy'] as const
type Inbox = typeof ALLOWED_INBOXES[number]

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MB per file
const MAX_FILES = 5

export async function POST(request: NextRequest) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const inbox = form.get('inbox') as string
  const name = (form.get('name') as string)?.trim()
  const email = (form.get('email') as string)?.trim().toLowerCase()
  const subject = (form.get('subject') as string)?.trim()
  const body = (form.get('body') as string)?.trim()

  if (!ALLOWED_INBOXES.includes(inbox as Inbox)) {
    return NextResponse.json({ error: 'Invalid inbox' }, { status: 400 })
  }
  if (!name || !email || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const files = form.getAll('files') as File[]
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 })
  }
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File "${f.name}" exceeds the 4 MB limit` }, { status: 400 })
    }
  }

  const supabase = createServiceClient()

  // Find or create thread
  let threadId: string
  const { data: existing } = await supabase
    .from('inbox_threads')
    .select('id, unread_count, contact_name')
    .eq('inbox', inbox)
    .eq('contact_email', email)
    .maybeSingle()

  if (existing) {
    threadId = existing.id
    await supabase
      .from('inbox_threads')
      .update({
        contact_name: name ?? existing.contact_name,
        last_message_at: new Date().toISOString(),
        unread_count: (existing.unread_count ?? 0) + 1,
      })
      .eq('id', threadId)
  } else {
    const { data: created } = await supabase
      .from('inbox_threads')
      .insert({
        inbox,
        contact_email: email,
        contact_name: name,
        subject: subject || body.slice(0, 80),
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select('id')
      .single()
    if (!created) return NextResponse.json({ error: 'Server error' }, { status: 500 })
    threadId = created.id
  }

  // Insert email/message row
  const { data: emailRow } = await supabase
    .from('inbox_emails')
    .insert({
      thread_id: threadId,
      direction: 'inbound',
      from_email: email,
      from_name: name,
      subject: subject || body.slice(0, 80),
      body_html: null,
      body_text: body,
      attachments: [],
    })
    .select('id')
    .single()

  if (!emailRow) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  // Upload attachments
  const storedAttachments: { name: string; path: string; mime_type: string; size: number }[] = []
  for (const file of files) {
    if (!file.name || file.size === 0) continue
    try {
      const buf = Buffer.from(await file.arrayBuffer())
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${inbox}/${threadId}/${emailRow.id}/${safeName}`
      const { error } = await supabase.storage
        .from('email-attachments')
        .upload(path, buf, { contentType: file.type || 'application/octet-stream', upsert: true })
      if (!error) {
        storedAttachments.push({ name: file.name, path, mime_type: file.type || 'application/octet-stream', size: file.size })
      }
    } catch (err) {
      console.error('File upload error:', err)
    }
  }

  if (storedAttachments.length > 0) {
    await supabase.from('inbox_emails').update({ attachments: storedAttachments }).eq('id', emailRow.id)
  }

  return NextResponse.json({ ok: true })
}
