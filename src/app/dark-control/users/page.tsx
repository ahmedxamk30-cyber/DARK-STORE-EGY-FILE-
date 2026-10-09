import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import UserManager from '../_components/UserManager';
import type { Profile } from '@/lib/types';

export const metadata = { title: 'المستخدمون', robots: { index: false } };

export default async function UsersAdmin() {
  const session = await getSession();
  if (!session) notFound();

  const { data } = await createClient()
    .from('profiles')
    .select('id, full_name, role, balance_cents, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader title="المستخدمون والأرصدة" description="كل تعديل على الرصيد يُسجَّل بسبب واضح في سجل الحركات." />
      <UserManager
        users={(data ?? []) as Profile[]}
        canAdjust={ADMIN_ROLES.includes(session.profile.role)}
        canChangeRole={session.profile.role === 'super_admin'}
        currentUserId={session.user.id}
      />
    </div>
  );
}
