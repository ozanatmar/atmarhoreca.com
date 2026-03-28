'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Supplier } from '@/types'

interface Props {
  suppliers: Supplier[]
}

const EMPTY: Partial<Supplier> = {
  name: '',
  country_code: '',
  lead_time_note: '',
  handling_days: 5,
  default_requires_confirmation: false,
  contact_email: '',
  active: true,
}

export default function SupplierList({ suppliers }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()
    if (editing.id) {
      await supabase.from('suppliers').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('suppliers').insert(editing)
    }
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      {suppliers.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#1A1A5E]">{s.name}</p>
            <p className="text-sm text-gray-500">{s.country_code} &bull; {s.lead_time_note}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(s)}>Edit</Button>
        </div>
      ))}

      <Button onClick={() => setEditing(EMPTY)} className="w-fit">+ New Supplier</Button>

      {editing && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4 border-2 border-[#6B3D8F]">
          <h2 className="font-bold text-[#1A1A5E]">{editing.id ? 'Edit Supplier' : 'New Supplier'}</h2>
          <Input label="Name" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
          <Input label="Country Code (ISO alpha-2)" value={editing.country_code ?? ''} onChange={(e) => setEditing({ ...editing, country_code: e.target.value.toUpperCase().slice(0, 2) })} required maxLength={2} />
          <Input label="Lead Time Note" value={editing.lead_time_note ?? ''} onChange={(e) => setEditing({ ...editing, lead_time_note: e.target.value })} />
          <Input label="Handling Days" type="number" min={0} value={String(editing.handling_days ?? 5)} onChange={(e) => setEditing({ ...editing, handling_days: parseInt(e.target.value) })} />
          <Input label="Contact Email" type="email" value={editing.contact_email ?? ''} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editing.default_requires_confirmation ?? false} onChange={(e) => setEditing({ ...editing, default_requires_confirmation: e.target.checked })} />
            <span className="text-sm">Default requires confirmation</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            <span className="text-sm">Active</span>
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
