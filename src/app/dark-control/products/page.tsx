import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import ProductManager from '../_components/ProductManager';
import type { Category, Product } from '@/lib/types';

export default async function ProductsAdmin() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.profile.role)) notFound();

  const supabase = createClient();
  const [prodRes, catRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, category_id, name_ar, description_ar, image_url, price_cents, old_price_cents, is_offer, is_active, sort_order')
      .order('sort_order')
      .limit(300),
    supabase.from('categories').select('id, slug, name_ar, kind, image_url, sort_order, is_visible').order('sort_order'),
  ]);

  return (
    <div>
      <PageHeader title="المنتجات والأسعار" description="الأسعار تُخزَّن بالقروش داخل قاعدة البيانات، والخادم هو من يتحقق منها عند الشراء." />
      <ProductManager products={(prodRes.data ?? []) as Product[]} categories={(catRes.data ?? []) as Category[]} />
    </div>
  );
}
