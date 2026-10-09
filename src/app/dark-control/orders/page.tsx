import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import { formatDateTime, formatMoney } from '@/lib/format';
import PageHeader from '@/components/PageHeader';
import OrderStatusSelect from '../_components/OrderStatusSelect';
import type { Order } from '@/lib/types';

export default async function OrdersAdmin() {
  const session = await getSession();
  if (!session) notFound();
  const canEdit = ADMIN_ROLES.includes(session.profile.role);

  const { data } = await createClient()
    .from('orders')
    .select('id, product_name_ar, price_cents, player_reference, status, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as (Order & { profiles: { full_name: string | null } | { full_name: string | null }[] | null })[];

  return (
    <div>
      <PageHeader title="الطلبات" description={canEdit ? 'حدّث حالة كل طلب بعد تنفيذه.' : 'عرض فقط. تعديل الحالة للإدارة.'} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-right text-muted">
            <tr className="border-b border-border">
              <th className="p-3">التاريخ</th><th className="p-3">المستخدم</th><th className="p-3">المنتج</th>
              <th className="p-3">المرجع</th><th className="p-3">السعر</th><th className="p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">لا توجد طلبات بعد.</td></tr>
            )}
            {rows.map((o) => {
              const p = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
              return (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted">{formatDateTime(o.created_at)}</td>
                  <td className="p-3">{p?.full_name || '—'}</td>
                  <td className="p-3">{o.product_name_ar}</td>
                  <td className="p-3" dir="ltr">{o.player_reference ?? '—'}</td>
                  <td className="p-3" dir="ltr">{formatMoney(o.price_cents)}</td>
                  <td className="p-3">
                    {canEdit ? <OrderStatusSelect orderId={o.id} status={o.status} /> : <span>{o.status}</span>}
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
