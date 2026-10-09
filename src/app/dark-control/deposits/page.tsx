import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import { formatDateTime, formatMoney } from '@/lib/format';
import { DEPOSIT_METHOD_LABEL, DEPOSIT_STATUS_LABEL } from '@/lib/labels';
import PageHeader from '@/components/PageHeader';
import DepositReview from '../_components/DepositReview';
import type { Deposit } from '@/lib/types';

export const metadata = { title: 'الإيداعات', robots: { index: false } };

type Row = Deposit & { profiles: { full_name: string | null } | { full_name: string | null }[] | null };

export default async function DepositsAdmin() {
  const session = await getSession();
  if (!session) notFound();
  const canReview = ADMIN_ROLES.includes(session.profile.role);

  const { data } = await createClient()
    .from('deposits')
    .select('id, user_id, amount_cents, proof_path, method, payer_reference, status, created_at, reviewed_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <PageHeader
        title="الإيداعات"
        description="راجع التحويل وصورة الإثبات قبل الاعتماد. الاعتماد يضيف الرصيد فورًا."
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-right text-muted">
            <tr className="border-b border-border">
              <th className="p-3">التاريخ</th><th className="p-3">المستخدم</th><th className="p-3">المبلغ</th>
              <th className="p-3">الطريقة</th><th className="p-3">المرجع</th><th className="p-3">الحالة</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted">لا توجد طلبات إيداع بعد.</td></tr>
            )}
            {rows.map((d) => {
              const p = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
              return (
                <tr key={d.id} className="border-b border-border align-top last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted">{formatDateTime(d.created_at)}</td>
                  <td className="p-3">{p?.full_name || '—'}</td>
                  <td className="p-3 font-bold text-gold" dir="ltr">{formatMoney(d.amount_cents)}</td>
                  <td className="p-3">{DEPOSIT_METHOD_LABEL[d.method]}</td>
                  <td className="p-3" dir="ltr">{d.payer_reference ?? '—'}</td>
                  <td className="p-3">{DEPOSIT_STATUS_LABEL[d.status]}</td>
                  <td className="p-3">
                    <DepositReview depositId={d.id} proofPath={d.proof_path} pending={d.status === 'pending'} canReview={canReview} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
