import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const INBOXES = [
  {
    id: 'returns',
    label: 'Returns',
    email: 'returns@atmarhoreca.com',
    description: 'Return requests from customers',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    email: 'privacy@atmarhoreca.com',
    description: 'Privacy and data-related enquiries',
  },
]

export default async function InboxOverviewPage() {
  const supabase = createServiceClient()

  const { data: threads } = await supabase
    .from('inbox_threads')
    .select('inbox, unread_count')

  const unreadByInbox: Record<string, number> = {}
  for (const t of threads ?? []) {
    unreadByInbox[t.inbox] = (unreadByInbox[t.inbox] ?? 0) + (t.unread_count ?? 0)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1A1A5E] mb-6">Inbox</h1>
      <div className="flex flex-col gap-4">
        {INBOXES.map((inbox) => {
          const unread = unreadByInbox[inbox.id] ?? 0
          return (
            <Link
              key={inbox.id}
              href={`/admin/inbox/${inbox.id}`}
              className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-[#1A1A5E] text-lg">{inbox.label}</span>
                  {unread > 0 && (
                    <span className="bg-[#6B3D8F] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{inbox.email}</p>
                <p className="text-sm text-gray-400 mt-0.5">{inbox.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
