'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/games', label: 'الألعاب' },
  { href: '/social', label: 'خدمات السوشيال ميديا' },
  { href: '/offers', label: 'العروض' },
  { href: '/products', label: 'المنتجات' },
  { href: '/orders', label: 'الطلبات' },
  { href: '/wallet', label: 'المحفظة' },
  { href: '/deposit', label: 'إضافة الرصيد' },
  { href: '/account', label: 'الحساب' },
  { href: '/login', label: 'تسجيل الدخول' },
  { href: '/register', label: 'إنشاء حساب' },
  { href: '/contact', label: 'تواصل مع المطور' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          aria-expanded={open}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          القائمة
        </button>
        <Link href="/" className="font-bold tracking-wider text-gold">
          DARK STORE
        </Link>
        <ThemeToggle />
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link href="/" className="text-lg font-bold tracking-widest text-gold">
            DARK STORE
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
            className="rounded-md px-2 py-1 text-muted lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav aria-label="التنقل الرئيسي" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-lg px-4 py-3 text-sm transition-colors duration-fast ${
                      active
                        ? 'bg-gold/10 font-bold text-gold shadow-[inset_3px_0_0_rgb(var(--neon))]'
                        : 'text-fg hover:bg-bg'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <ThemeToggle />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
