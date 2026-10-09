'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveSettingAction } from '@/app/dark-control/actions';
import AuthMessage from '@/components/AuthMessage';

type Fields = Record<string, string>;

export default function SettingsForm({
  settingKey,
  title,
  description,
  initial,
  fields,
}: {
  settingKey: 'payment_instructions' | 'contact';
  title: string;
  description: string;
  initial: Fields;
  fields: { key: string; label: string; multiline?: boolean; ltr?: boolean }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Fields>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const res = await saveSettingAction(settingKey, values);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم الحفظ.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2';

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {msg && <AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage>}
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-sm">{f.label}</label>
          {f.multiline ? (
            <textarea className={input} rows={3} value={values[f.key] ?? ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          ) : (
            <input className={`${input} ${f.ltr ? 'text-left' : ''}`} dir={f.ltr ? 'ltr' : undefined}
              value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          )}
        </div>
      ))}
      <button type="submit" disabled={busy} className="rounded-lg bg-gold px-5 py-2 font-bold text-black disabled:opacity-60">
        {busy ? 'جارٍ الحفظ…' : 'حفظ'}
      </button>
    </form>
  );
}
