import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const INBOX_LABELS: Record<string, string> = { returns: 'Returns', privacy: 'Privacy' }
const INBOX_EMAILS: Record<string, string> = {
  returns: 'returns@atmarhoreca.com',
  privacy: 'privacy@atmarhoreca.com',
}

interface Props {
  params: Promise<{ mailbox: string }>
}

export default async function MailboxPage({ params }: Props) {
  const { mailbox } = await params

  if (!INBOX_LABELS[mailbox]) notFound()

  const supabase = createServiceClient()

  const { data: threads } = await supabase
    .from('inbox_threads')
    .select('id, contact_email, contact_name, subject, last_message_at, unread_count')
    .eq('inbox', mailbox)
    .order('last_message_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/inbox" className="text-sm text-[#6B3D8F] hover:underline">
          ← Inbox
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold text-[#1A1A5E]">{INBOX_LABELS[mailbox]}</h1>
        <span className="text-sm text-gray-400">{INBOX_EMAILS[mailbox]}</span>
      </div>

      {!threads?.length ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-400">
          No messages yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((t) => {
            const date = new Date(t.last_message_at)
            const isToday = date.toDateString() === new Date().toDateString()
            const dateStr = isToday
              ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <Link
                key={t.id}
                href={`/admin/inbox/${mailbox}/${t.id}`}
                className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {t.unread_count > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#6B3D8F] shrink-0" />
                    )}
                    <span className={`text-sm ${t.unread_count > 0 ? 'font-bold text-[#1A1A5E]' : 'font-medium text-gray-700'} truncate`}>
                      {t.contact_name ? `${t.contact_name} <${t.contact_email}>` : t.contact_email}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{t.subject ?? '(no subject)'}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{dateStr}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
