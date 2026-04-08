import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const INBOX_FROM: Record<string, string> = {
  returns: 'returns@atmarhoreca.com',
  privacy: 'privacy@atmarhoreca.com',
}

interface Attachment {
  name: string
  content: string // base64
  mime_type: string
}

function buildQuotedHtml(
  previousEmails: { from_email: string; from_name: string | null; created_at: string; body_html: string | null; body_text: string | null }[]
): string {
  return previousEmails
    .map((e) => {
      const sender = e.from_name ? `${e.from_name} &lt;${e.from_email}&gt;` : e.from_email
      const date = new Date(e.created_at).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
      const body = e.body_html ?? `<pre>${e.body_text ?? ''}</pre>`
      return `
        <div style="border-left:3px solid #ccc;padding:8px 12px;margin:12px 0;color:#555;font-size:14px">
          <p style="margin:0 0 6px"><strong>From:</strong> ${sender}<br><strong>Date:</strong> ${date}</p>
          <div>${body}</div>
        </div>`
    })
    .join('\n')
}

export async function POST(request: NextRequest) {
  // Admin auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { threadId, body, attachments = [] }: {
    threadId: string
    body: string
    attachments: Attachment[]
  } = await request.json()

  if (!threadId || !body?.trim()) {
    return NextResponse.json({ error: 'Missing threadId or body' }, { status: 400 })
  }

  const service = createServiceClient()

  // Load thread
  const { data: thread } = await service
    .from('inbox_threads')
    .select('id, inbox, contact_email, contact_name, subject')
    .eq('id', threadId)
    .single()

  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  const fromEmail = INBOX_FROM[thread.inbox]
  if (!fromEmail) return NextResponse.json({ error: 'Unknown inbox' }, { status: 400 })

  // Load previous emails for quoting and threading headers
  const { data: prevEmails } = await service
    .from('inbox_emails')
    .select('id, message_id, from_email, from_name, created_at, body_html, body_text')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  const lastInbound = [...(prevEmails ?? [])].reverse().find((e) => e.message_id)
  const allMessageIds = (prevEmails ?? []).map((e) => e.message_id).filter(Boolean)

  const subject = thread.subject?.startsWith('Re:')
    ? thread.subject
    : `Re: ${thread.subject ?? '(no subject)'}`

  // Build HTML body with full thread history
  const replyHtml = `
    <div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#222">
      ${body.split('\n').map((line) => `<p style="margin:0 0 8px">${line || '&nbsp;'}</p>`).join('')}
    </div>
    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
    <div style="font-size:13px;color:#666">
      ${buildQuotedHtml(prevEmails ?? [])}
    </div>`

  // Send via Brevo SMTP API
  const newMessageId = `<${crypto.randomUUID()}@atmarhoreca.com>`
  const brevoPayload: Record<string, unknown> = {
    sender: { name: 'Atmar Horeca', email: fromEmail },
    to: [{ email: thread.contact_email, name: thread.contact_name ?? undefined }],
    subject,
    htmlContent: replyHtml,
    headers: {
      'Message-ID': newMessageId,
      ...(lastInbound?.message_id ? { 'In-Reply-To': lastInbound.message_id } : {}),
      ...(allMessageIds.length ? { References: allMessageIds.join(' ') } : {}),
    },
  }

  if (attachments.length > 0) {
    brevoPayload.attachment = attachments.map((a) => ({ name: a.name, content: a.content }))
  }

  const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json' },
    body: JSON.stringify(brevoPayload),
  })

  if (!brevoRes.ok) {
    const text = await brevoRes.text()
    console.error('Brevo reply error:', text)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  // Store outbound attachments in Supabase Storage
  const storedAttachments: { name: string; path: string; mime_type: string; size: number }[] = []
  for (const att of attachments) {
    const buf = Buffer.from(att.content, 'base64')
    // We'll get the email row id after insert; use a temp path placeholder updated below
    storedAttachments.push({ name: att.name, path: '', mime_type: att.mime_type, size: buf.length })
  }

  // Insert outbound email
  const { data: emailRow } = await service
    .from('inbox_emails')
    .insert({
      thread_id: threadId,
      direction: 'outbound',
      message_id: newMessageId,
      in_reply_to: lastInbound?.message_id ?? null,
      from_email: fromEmail,
      from_name: 'Atmar Horeca',
      subject,
      body_html: replyHtml,
      body_text: body,
      attachments: [],
    })
    .select('id')
    .single()

  if (emailRow && attachments.length > 0) {
    const finalAttachments: { name: string; path: string; mime_type: string; size: number }[] = []
    for (const att of attachments) {
      const buf = Buffer.from(att.content, 'base64')
      const path = `${thread.inbox}/${threadId}/${emailRow.id}/${att.name}`
      const { error } = await service.storage
        .from('email-attachments')
        .upload(path, buf, { contentType: att.mime_type, upsert: true })
      if (!error) {
        finalAttachments.push({ name: att.name, path, mime_type: att.mime_type, size: buf.length })
      }
    }
    if (finalAttachments.length > 0) {
      await service.from('inbox_emails').update({ attachments: finalAttachments }).eq('id', emailRow.id)
    }
  }

  // Update thread
  await service
    .from('inbox_threads')
    .update({ last_message_at: new Date().toISOString(), unread_count: 0 })
    .eq('id', threadId)

  return NextResponse.json({ ok: true })
}
