import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import CategoryManager from '../_components/CategoryManager';
import type { Category } from '@/lib/types';

export default async function CategoriesAdmin() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.profile.role)) notFound();

  const { data } = await createClient()
    .from('categories')
    .select('id, slug, name_ar, kind, image_url, sort_order, is_visible')
    .order('sort_order');

  return (
    <div>
      <PageHeader title="الأقسام" description="أضف الأقسام وأخفِها وحدد ترتيبها. لا يمكن حذف قسم يحتوي على منتجات." />
      <CategoryManager categories={(data ?? []) as Category[]} />
    </div>
  );
}
