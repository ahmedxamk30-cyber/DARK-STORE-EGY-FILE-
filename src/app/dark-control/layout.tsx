import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession, ADMIN_ROLES, STAFF_ROLES } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/labels';
import type { Role } from '@/lib/types';

export const metadata = { title: 'DARK CONTROL', robots: { index: false, follow: false } };

// Staff-only area. Regular users get a 404 so the panel's existence is not revealed.
// Each page and action also checks the role; this layout is only the first gate.
const LINKS: { href: string; label: string; minRole: 'staff' | 'admin' | 'super' }[] = [
  { href: '/dark-control', label: 'الرئيسية', minRole: 'staff' },
  { href: '/dark-control/orders', label: 'الطلبات', minRole: 'staff' },
  { href: '/dark-control/deposits', label: 'الإيداعات', minRole: 'staff' },
  { href: '/dark-control/users', label: 'المستخدمون والأرصدة', minRole: 'staff' },
  { href: '/dark-control/categories', label: 'الأقسام', minRole: 'admin' },
  { href: '/dark-control/products', label: 'المنتجات والأسعار', minRole: 'admin' },
  { href: '/dark-control/sections', label: 'محرر الصفحة الرئيسية', minRole: 'admin' },
  { href: '/dark-control/settings', label: 'الإعدادات', minRole: 'admin' },
];

function canSee(role: Role, min: 'staff' | 'admin' | 'super') {
  if (min === 'staff') return STAFF_ROLES.includes(role);
  if (min === 'admin') return ADMIN_ROLES.includes(role);
  return role === 'super_admin';
}

export default async function DarkControlLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !STAFF_ROLES.includes(session.profile.role)) notFound();
  const role = session.profile.role;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-border bg-card lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-l">
        <div className="p-5">
          <p className="text-lg font-black tracking-widest text-gold">DARK CONTROL</p>
          <p className="mt-1 text-xs text-muted">الدور: {ROLE_LABEL[role]}</p>
        </div>
        <nav aria-label="لوحة التحكم" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {LINKS.filter((l) => canSee(role, l.minRole)).map((l) => (
            <Link key={l.href} href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-bg hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-8">{children}</div>
    </div>
  );
}
