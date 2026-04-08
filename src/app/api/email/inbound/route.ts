import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function extractAddress(raw: string | null | undefined): { email: string; name: string | null } {
  if (!raw) return { email: '', name: null }
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim() || null, email: match[2].trim().toLowerCase() }
  return { name: null, email: raw.trim().toLowerCase() }
}

function detectInbox(to: string | null | undefined): 'returns' | 'privacy' | null {
  const lower = (to ?? '').toLowerCase()
  if (lower.includes('returns@')) return 'returns'
  if (lower.includes('privacy@')) return 'privacy'
  return null
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.INBOX_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Mailgun sends multipart/form-data
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const toRaw = form.get('To') as string | null
  const inbox = detectInbox(toRaw)
  if (!inbox) return NextResponse.json({ ok: true })

  const { email: fromEmail, name: fromName } = extractAddress(form.get('from') as string)
  if (!fromEmail) return NextResponse.json({ ok: true })

  const subject = (form.get('subject') as string) ?? '(no subject)'
  const messageId = (form.get('Message-Id') as string) ?? null
  const inReplyTo = (form.get('In-Reply-To') as string) ?? null
  const bodyHtml = (form.get('body-html') as string) ?? null
  const bodyText = (form.get('body-plain') as string) ?? null

  // Attachment count sent by Mailgun as "attachment-count"
  const attachmentCount = parseInt((form.get('attachment-count') as string) ?? '0', 10)

  const supabase = createServiceClient()

  // Find or create thread
  let threadId: string
  const { data: existing } = await supabase
    .from('inbox_threads')
    .select('id, unread_count, contact_name')
    .eq('inbox', inbox)
    .eq('contact_email', fromEmail)
    .maybeSingle()

  if (existing) {
    threadId = existing.id
    await supabase
      .from('inbox_threads')
      .update({
        contact_name: fromName ?? existing.contact_name,
        last_message_at: new Date().toISOString(),
        unread_count: (existing.unread_count ?? 0) + 1,
      })
      .eq('id', threadId)
  } else {
    const { data: created } = await supabase
      .from('inbox_threads')
      .insert({
        inbox,
        contact_email: fromEmail,
        contact_name: fromName,
        subject,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select('id')
      .single()
    if (!created) return NextResponse.json({ error: 'DB error' }, { status: 500 })
    threadId = created.id
  }

  // Insert email row
  const { data: emailRow } = await supabase
    .from('inbox_emails')
    .insert({
      thread_id: threadId,
      direction: 'inbound',
      message_id: messageId,
      in_reply_to: inReplyTo,
      from_email: fromEmail,
      from_name: fromName,
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      attachments: [],
    })
    .select('id')
    .single()

  if (!emailRow) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // Upload attachments — Mailgun sends them as form file fields: attachment-1, attachment-2, ...
  const storedAttachments: { name: string; path: string; mime_type: string; size: number }[] = []

  for (let i = 1; i <= attachmentCount; i++) {
    const file = form.get(`attachment-${i}`) as File | null
    if (!file) continue
    try {
      const buf = Buffer.from(await file.arrayBuffer())
      const path = `${inbox}/${threadId}/${emailRow.id}/${file.name}`
      const { error } = await supabase.storage
        .from('email-attachments')
        .upload(path, buf, { contentType: file.type || 'application/octet-stream', upsert: true })
      if (!error) {
        storedAttachments.push({
          name: file.name,
          path,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
        })
      }
    } catch (err) {
      console.error('Attachment upload failed:', err)
    }
  }

  if (storedAttachments.length > 0) {
    await supabase.from('inbox_emails').update({ attachments: storedAttachments }).eq('id', emailRow.id)
  }

  return NextResponse.json({ ok: true })
}
