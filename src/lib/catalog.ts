import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Category, HomeSection, Product } from './types';

// Every loader reports whether the backend is configured and whether the query failed,
// so pages can show a clear message instead of fake data.
export type Loaded<T> = { data: T; configured: boolean; failed: boolean };

const CATEGORY_FIELDS = 'id, slug, name_ar, kind, image_url, sort_order, is_visible';
const PRODUCT_FIELDS =
  'id, category_id, name_ar, description_ar, image_url, price_cents, old_price_cents, is_offer, is_active, sort_order';

export async function loadCategories(kind?: Category['kind']): Promise<Loaded<Category[]>> {
  if (!isSupabaseConfigured()) return { data: [], configured: false, failed: false };
  const supabase = createClient();
  let query = supabase.from('categories').select(CATEGORY_FIELDS).eq('is_visible', true).order('sort_order');
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  return { data: (data ?? []) as Category[], configured: true, failed: Boolean(error) };
}

export async function loadProducts(options: { offersOnly?: boolean } = {}): Promise<Loaded<Product[]>> {
  if (!isSupabaseConfigured()) return { data: [], configured: false, failed: false };
  const supabase = createClient();
  let query = supabase.from('products').select(PRODUCT_FIELDS).eq('is_active', true).order('sort_order');
  if (options.offersOnly) query = query.eq('is_offer', true);
  const { data, error } = await query;
  return { data: (data ?? []) as Product[], configured: true, failed: Boolean(error) };
}

export async function loadProduct(id: string): Promise<Loaded<Product | null>> {
  if (!isSupabaseConfigured()) return { data: null, configured: false, failed: false };
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  return { data: (data as Product | null) ?? null, configured: true, failed: Boolean(error) };
}

export async function loadHomeSections(): Promise<Loaded<HomeSection[]>> {
  if (!isSupabaseConfigured()) return { data: [], configured: false, failed: false };
  const supabase = createClient();
  const { data, error } = await supabase
    .from('home_sections')
    .select('id, kind, title_ar, content, sort_order, is_visible')
    .eq('is_visible', true)
    .order('sort_order');
  return { data: (data ?? []) as HomeSection[], configured: true, failed: Boolean(error) };
}

export async function loadSetting<T>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  return (data?.value as T | undefined) ?? null;
}
