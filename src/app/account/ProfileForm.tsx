'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthMessage from '@/components/AuthMessage';

export default function ProfileForm({ userId, initialName }: { userId: string; initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const supabase = createClient();
      // Only full_name is writable by clients (see schema grants); role and balance cannot change here.
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name.trim() })
        .eq('id', userId);
      if (error) throw error;
      setMsg({ type: 'success', text: 'تم حفظ الاسم.' });
      router.refresh();
    } catch {
      setMsg({ type: 'error', text: 'تعذر حفظ الاسم. حاول مرة أخرى.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg && <AuthMessage type={msg.type}>{msg.text}</AuthMessage>}
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm">الاسم الكامل</label>
        <input id="full_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3" />
      </div>
      <button type="submit" disabled={saving}
        className="rounded-lg bg-gold px-5 py-3 font-bold text-black disabled:opacity-60">
        {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
      </button>
    </form>
  );
}
