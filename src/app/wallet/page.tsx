import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime, formatMoney } from '@/lib/format';
import { DEPOSIT_METHOD_LABEL, DEPOSIT_STATUS_LABEL } from '@/lib/labels';
import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import type { Deposit, WalletTransaction } from '@/lib/types';

export const metadata = { title: 'المحفظة' };

export default async function WalletPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/wallet');

  const supabase = createClient();
  const [txRes, depRes] = await Promise.all([
    supabase
      .from('wallet_transactions')
      .select('id, amount_cents, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('deposits')
      .select('id, amount_cents, method, payer_reference, status, created_at, reviewed_at, proof_path')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  const transactions = (txRes.data ?? []) as WalletTransaction[];
  const deposits = (depRes.data ?? []) as Deposit[];

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-8">
      <PageHeader title="المحفظة" description="رصيدك وسجل حركاتك وطلبات الإيداع." />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">الرصيد الحالي</p>
          <p className="mt-1 text-3xl font-black text-neon" dir="ltr">{formatMoney(session.profile.balance_cents)}</p>
        </div>
        <Link href="/deposit" className="rounded-lg bg-gold px-6 py-3 text-center font-bold text-black hover:opacity-90">
          إضافة رصيد
        </Link>
      </section>

      <section aria-labelledby="tx-title">
        <h2 id="tx-title" className="mb-4 font-bold">سجل الحركات</h2>
        {transactions.length === 0 ? (
          <Notice title="لا توجد حركات بعد" />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div>
                  <p>{t.reason.startsWith('order:') ? 'شراء منتج' : t.reason.startsWith('deposit:') ? 'إيداع معتمد' : 'تعديل من الإدارة'}</p>
                  <p className="text-xs text-muted">{formatDateTime(t.created_at)}</p>
                </div>
                <span dir="ltr" className={`font-bold ${t.amount_cents < 0 ? 'text-red-400' : 'text-neon'}`}>
                  {t.amount_cents > 0 ? '+' : ''}{formatMoney(t.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="dep-title">
        <h2 id="dep-title" className="mb-4 font-bold">طلبات الإيداع</h2>
        {deposits.length === 0 ? (
          <Notice title="لم ترسل أي طلب إيداع بعد" />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {deposits.map((d) => (
              <li key={d.id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p dir="ltr" className="font-bold">{formatMoney(d.amount_cents)}</p>
                  <p className="text-xs text-muted">
                    {DEPOSIT_METHOD_LABEL[d.method]} · {formatDateTime(d.created_at)}
                  </p>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs">{DEPOSIT_STATUS_LABEL[d.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
