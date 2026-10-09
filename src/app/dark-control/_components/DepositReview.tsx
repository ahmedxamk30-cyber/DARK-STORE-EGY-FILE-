'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getProofUrlAction, reviewDepositAction } from '@/app/dark-control/actions';
import AuthMessage from '@/components/AuthMessage';

export default function DepositReview({
  depositId,
  proofPath,
  pending,
  canReview,
}: {
  depositId: string;
  proofPath: string;
  pending: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function viewProof() {
    const res = await getProofUrlAction(proofPath);
    if (res.ok) window.open(res.url, '_blank', 'noopener,noreferrer');
    else setMsg({ ok: false, text: res.error });
  }

  async function review(approve: boolean) {
    const question = approve
      ? 'اعتماد هذا الإيداع؟ سيُضاف المبلغ إلى رصيد المستخدم. تأكد من التحويل أولًا.'
      : 'رفض هذا الإيداع؟';
    if (!window.confirm(question)) return;
    setBusy(true);
    const res = await reviewDepositAction(depositId, approve);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={viewProof} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-gold">
          عرض الإثبات
        </button>
        {canReview && pending && (
          <>
            <button type="button" disabled={busy} onClick={() => review(true)}
              className="rounded-lg bg-gold px-3 py-2 text-sm font-bold text-black disabled:opacity-60">اعتماد</button>
            <button type="button" disabled={busy} onClick={() => review(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-red-400 disabled:opacity-60">رفض</button>
          </>
        )}
      </div>
      {msg && <div className="w-full max-w-xs"><AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage></div>}
    </div>
  );
}
