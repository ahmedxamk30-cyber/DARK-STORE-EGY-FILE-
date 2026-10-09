import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime, formatMoney } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import type { Order } from '@/lib/types';

export const metadata = { title: 'طلباتي' };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/orders');

  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('id, product_name_ar, price_cents, player_reference, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  const orders = (data ?? []) as Order[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <PageHeader title="طلباتي" description="تابع حالة كل طلب قمت به." />
      {error && <Notice title="تعذر تحميل الطلبات">حاول تحديث الصفحة.</Notice>}
      {!error && orders.length === 0 && (
        <Notice title="لا توجد طلبات بعد">عند شرائك منتجًا سيظهر طلبك هنا.</Notice>
      )}
      {!error && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold">{o.product_name_ar}</p>
                <p className="text-xs text-muted">
                  {formatDateTime(o.created_at)} · المرجع: <span dir="ltr">{o.player_reference ?? '—'}</span>
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span dir="ltr" className="font-bold text-gold">{formatMoney(o.price_cents)}</span>
                <span className="rounded-full border border-border px-3 py-1">{ORDER_STATUS_LABEL[o.status]}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
