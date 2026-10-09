import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

export default async function DarkControlHome() {
  const session = await getSession();
  const isAdmin = session ? ADMIN_ROLES.includes(session.profile.role) : false;
  const supabase = createClient();

  const count = async (table: string, filter?: [string, string]) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [pendingDeposits, pendingOrders, users, products] = await Promise.all([
    count('deposits', ['status', 'pending']),
    count('orders', ['status', 'pending']),
    count('profiles'),
    count('products'),
  ]);

  const stats = [
    { label: 'إيداعات بانتظار المراجعة', value: pendingDeposits, href: '/dark-control/deposits' },
    { label: 'طلبات قيد الانتظار', value: pendingOrders, href: '/dark-control/orders' },
    { label: 'عدد المستخدمين', value: users, href: '/dark-control/users' },
    ...(isAdmin ? [{ label: 'عدد المنتجات', value: products, href: '/dark-control/products' }] : []),
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader title="لوحة التحكم" description="ملخص سريع. اختر قسمًا من القائمة للتفاصيل." />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="block rounded-xl border border-border bg-card p-5 hover:border-gold">
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-2 text-3xl font-black text-neon">{s.value}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
