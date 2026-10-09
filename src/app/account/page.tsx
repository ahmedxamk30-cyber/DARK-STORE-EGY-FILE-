import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { formatMoney } from '@/lib/format';
import { signOutAction } from '@/app/auth/actions';
import PageHeader from '@/components/PageHeader';
import ProfileForm from './ProfileForm';

export const metadata = { title: 'حسابي' };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/account');

  const { user, profile } = session;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <PageHeader title="حسابي" description="بياناتك الشخصية ورصيدك الحالي." />

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted">الرصيد الحالي</p>
          <p className="mt-2 text-2xl font-black text-neon" dir="ltr">{formatMoney(profile.balance_cents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted">البريد الإلكتروني</p>
          <p className="mt-2 break-all text-sm" dir="ltr">{user.email ?? '—'}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-bold">البيانات الشخصية</h2>
        <ProfileForm userId={user.id} initialName={profile.full_name ?? ''} />
      </section>

      <form action={signOutAction} className="mt-8">
        <button type="submit" className="rounded-lg border border-border px-5 py-3 text-sm hover:border-gold">
          تسجيل الخروج
        </button>
      </form>
    </div>
  );
}
