import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import ReplyComposer from './ReplyComposer'

export const dynamic = 'force-dynamic'

const INBOX_LABELS: Record<string, string> = { returns: 'Returns', privacy: 'Privacy' }

interface Props {
  params: Promise<{ mailbox: string; threadId: string }>
}

export default async function ThreadPage({ params }: Props) {
  const { mailbox, threadId } = await params

  if (!INBOX_LABELS[mailbox]) notFound()

  const supabase = createServiceClient()

  const { data: thread } = await supabase
    .from('inbox_threads')
    .select('id, inbox, contact_email, contact_name, subject, unread_count')
    .eq('id', threadId)
    .single()

  if (!thread || thread.inbox !== mailbox) notFound()

  const { data: emails } = await supabase
    .from('inbox_emails')
    .select('id, direction, from_email, from_name, subject, body_html, body_text, attachments, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  // Mark thread as read
  if (thread.unread_count > 0) {
    await supabase.from('inbox_threads').update({ unread_count: 0 }).eq('id', threadId)
  }

  // Generate signed URLs for all attachments
  type Attachment = { name: string; path: string; mime_type: string; size: number }
  const signedUrlMap: Record<string, string> = {}
  const allPaths = (emails ?? [])
    .flatMap((e) => (e.attachments as Attachment[]).map((a) => a.path))
    .filter(Boolean)

  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('email-attachments')
      .createSignedUrls(allPaths, 3600)
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedUrlMap[s.path] = s.signedUrl
    }
  }

  const senderLabel = thread.contact_name
    ? `${thread.contact_name} <${thread.contact_email}>`
    : thread.contact_email

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
        <Link href="/admin/inbox" className="text-[#6B3D8F] hover:underline">Inbox</Link>
        <span className="text-gray-400">/</span>
        <Link href={`/admin/inbox/${mailbox}`} className="text-[#6B3D8F] hover:underline">
          {INBOX_LABELS[mailbox]}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 truncate">{thread.subject ?? '(no subject)'}</span>
      </div>

      {/* Thread header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <h1 className="text-xl font-bold text-[#1A1A5E] mb-1">{thread.subject ?? '(no subject)'}</h1>
        <p className="text-sm text-gray-500">Correspondent: {senderLabel}</p>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 mb-4">
        {(emails ?? []).map((email) => {
          const isInbound = email.direction === 'inbound'
          const attachments = email.attachments as Attachment[]
          const dateStr = new Date(email.created_at).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })

          return (
            <div
              key={email.id}
              className={`rounded-2xl shadow-sm overflow-hidden ${isInbound ? 'bg-white' : 'bg-[#F3EDF8] border border-[#D9C5ED]'}`}
            >
              {/* Message header */}
              <div className={`px-6 py-3 flex items-center justify-between border-b ${isInbound ? 'border-gray-100' : 'border-[#D9C5ED]'}`}>
                <div className="text-sm">
                  <span className={`font-semibold ${isInbound ? 'text-gray-800' : 'text-[#6B3D8F]'}`}>
                    {isInbound
                      ? (email.from_name ? `${email.from_name} <${email.from_email}>` : email.from_email)
                      : `You (${email.from_email})`}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{dateStr}</span>
              </div>

              {/* Message body */}
              <div className="px-6 py-4">
                {email.body_html ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: email.body_html }}
                  />
                ) : (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {email.body_text ?? '(empty)'}
                  </pre>
                )}
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className={`px-6 pb-4 flex flex-wrap gap-2`}>
                  {attachments.map((att, i) => {
                    const url = signedUrlMap[att.path]
                    return url ? (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm hover:border-[#6B3D8F] transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="truncate max-w-[200px]">{att.name}</span>
                        <span className="text-gray-400 text-xs shrink-0">({(att.size / 1024).toFixed(0)} KB)</span>
                      </a>
                    ) : (
                      <span key={i} className="text-sm text-gray-400">{att.name}</span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reply composer */}
      <ReplyComposer threadId={threadId} contactEmail={thread.contact_email} />
    </div>
  )
}
