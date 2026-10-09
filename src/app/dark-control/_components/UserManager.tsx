'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adjustBalanceAction, setRoleAction } from '@/app/dark-control/actions';
import { normalizeDigits, parseAmountToCents, formatMoney } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/labels';
import type { Profile, Role } from '@/lib/types';
import AuthMessage from '@/components/AuthMessage';

const ROLES: Role[] = ['user', 'support', 'admin', 'super_admin'];

export default function UserManager({
  users,
  canAdjust,
  canChangeRole,
  currentUserId,
}: {
  users: Profile[];
  canAdjust: boolean;
  canChangeRole: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function adjust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const cents = parseAmountToCents(amount);
    if (!cents) return setMsg({ ok: false, text: 'أدخل مبلغًا صحيحًا.' });
    const delta = direction === 'add' ? cents : -cents;
    if (!window.confirm(`تأكيد ${direction === 'add' ? 'إضافة' : 'خصم'} ${formatMoney(cents)}؟`)) return;
    setBusy(true);
    const res = await adjustBalanceAction(selected.id, delta, reason);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم.' } : { ok: false, text: res.error });
    if (res.ok) {
      setAmount('');
      setReason('');
      router.refresh();
    }
  }

  async function changeRole(role: Role) {
    if (!selected) return;
    if (!window.confirm(`تغيير دور المستخدم إلى "${ROLE_LABEL[role]}"؟`)) return;
    const res = await setRoleAction(selected.id, role);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2';

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-right text-muted">
            <tr className="border-b border-border">
              <th className="p-3">الاسم</th><th className="p-3">الدور</th><th className="p-3">الرصيد</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-border last:border-0 ${selected?.id === u.id ? 'bg-bg' : ''}`}>
                <td className="p-3">{u.full_name || <span className="text-muted">بدون اسم</span>}</td>
                <td className="p-3">{ROLE_LABEL[u.role]}</td>
                <td className="p-3" dir="ltr">{formatMoney(u.balance_cents)}</td>
                <td className="p-3 text-left">
                  <button type="button" onClick={() => { setSelected(u); setMsg(null); }}
                    className="rounded-lg border border-border px-3 py-1 hover:border-gold">إدارة</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-fit space-y-4 rounded-xl border border-border bg-card p-5">
        {!selected && <p className="text-sm text-muted">اختر مستخدمًا من القائمة لإدارة رصيده أو دوره.</p>}
        {selected && (
          <>
            <div>
              <p className="font-bold">{selected.full_name || 'بدون اسم'}</p>
              <p className="font-mono text-[11px] text-muted" dir="ltr">{selected.id}</p>
            </div>
            {msg && <AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage>}

            {canAdjust && (
              <form onSubmit={adjust} className="space-y-3">
                <p className="text-sm font-bold">تعديل الرصيد</p>
                <div className="flex gap-2">
                  <select className={input} value={direction} onChange={(e) => setDirection(e.target.value as 'add' | 'subtract')}>
                    <option value="add">إضافة</option>
                    <option value="subtract">خصم</option>
                  </select>
                  <input className={`${input} text-left`} dir="ltr" inputMode="decimal" placeholder="0.00" required
                    value={amount} onChange={(e) => setAmount(normalizeDigits(e.target.value))} />
                </div>
                <input className={input} placeholder="سبب التعديل (يُسجل في الحركات)" required minLength={3} maxLength={120}
                  value={reason} onChange={(e) => setReason(e.target.value)} />
                <button type="submit" disabled={busy} className="w-full rounded-lg bg-gold px-4 py-2 font-bold text-black disabled:opacity-60">
                  {busy ? 'جارٍ التنفيذ…' : 'تنفيذ التعديل'}
                </button>
              </form>
            )}

            {canChangeRole && (
              <div className="space-y-2">
                <p className="text-sm font-bold">الدور</p>
                <select className={input} value={selected.role} disabled={selected.id === currentUserId}
                  onChange={(e) => changeRole(e.target.value as Role)}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                {selected.id === currentUserId && <p className="text-xs text-muted">لا يمكنك تغيير دورك بنفسك.</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
