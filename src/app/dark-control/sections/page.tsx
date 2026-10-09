import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import SectionEditor from '../_components/SectionEditor';
import type { Category, HomeSection, Product } from '@/lib/types';

export const metadata = { title: 'محرر الصفحة الرئيسية', robots: { index: false } };

export default async function SectionsAdmin() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.profile.role)) notFound();

  const supabase = createClient();
  const [sec, cat, prod] = await Promise.all([
    supabase.from('home_sections').select('id, kind, title_ar, content, sort_order, is_visible').order('sort_order').order('id'),
    supabase.from('categories').select('id, slug, name_ar, kind, image_url, sort_order, is_visible').order('sort_order'),
    supabase.from('products').select('id, category_id, name_ar, description_ar, image_url, price_cents, old_price_cents, is_offer, is_active, sort_order').order('sort_order').limit(100),
  ]);

  return (
    <div>
      <PageHeader title="محرر الصفحة الرئيسية" description="أضف الأقسام وعدّل نصوصها وصورها بالترتيب الذي تريده. كل قسم يعرض معاينة فورية قبل الحفظ." />
      <SectionEditor
        sections={(sec.data ?? []) as HomeSection[]}
        categories={(cat.data ?? []) as Category[]}
        products={(prod.data ?? []) as Product[]}
      />
    </div>
  );
}
