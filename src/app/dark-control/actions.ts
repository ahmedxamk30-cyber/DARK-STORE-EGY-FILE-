'use server';

import { revalidatePath } from 'next/cache';
import { getActionContext } from '@/lib/auth';
import type { createClient } from '@/lib/supabase/server';
import type { ActionResult, Role } from '@/lib/types';

// Every action re-checks the role on the server. The UI hiding a button is not a security boundary.
const STAFF_ROLES: Role[] = ['support', 'admin', 'super_admin'];
const ADMIN_ROLES: Role[] = ['admin', 'super_admin'];
const SUPER_ROLES: Role[] = ['super_admin'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{2,60}$/;
const CATEGORY_KINDS = ['game', 'social', 'gift'] as const;
const SECTION_KINDS = ['hero', 'categories', 'offers', 'products', 'text', 'image'] as const;
const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
const ROLES = ['user', 'support', 'admin', 'super_admin'] as const;
const SETTING_KEYS = ['payment_instructions', 'contact'] as const;
const MAX_CENTS = 100000000;

type Supabase = ReturnType<typeof createClient>;
type Guard = { ok: true; supabase: Supabase; userId: string } | { ok: false; error: string };

async function guard(allowed: Role[]): Promise<Guard> {
  const ctx = await getActionContext();
  if (!ctx) return { ok: false, error: 'يجب تسجيل الدخول أولًا.' };
  if (!allowed.includes(ctx.role)) return { ok: false, error: 'ليست لديك صلاحية لهذا الإجراء.' };
  return { ok: true, supabase: ctx.supabase, userId: ctx.userId };
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_CENTS;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 && t.length <= max ? t : null;
}

function cleanOptionalUrl(value: unknown): string | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !value.startsWith('https://') || value.length > 500) return 'invalid';
  return value;
}

function revalidateStore() {
  revalidatePath('/', 'layout');
}

// ---------- Categories ----------
export type CategoryInput = {
  id?: string;
  slug: string;
  name_ar: string;
  kind: string;
  sort_order: number;
  is_visible: boolean;
  image_url?: string | null;
};

export async function saveCategoryAction(input: CategoryInput): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;

  const name = cleanText(input.name_ar, 80);
  const slug = typeof input.slug === 'string' ? input.slug.trim().toLowerCase() : '';
  const image = cleanOptionalUrl(input.image_url);
  if (!name) return { ok: false, error: 'اكتب اسم القسم (حتى 80 حرفًا).' };
  if (!SLUG.test(slug)) return { ok: false, error: 'الرابط المختصر يجب أن يكون أحرفًا إنجليزية صغيرة وأرقامًا وشرطات.' };
  if (!(CATEGORY_KINDS as readonly string[]).includes(input.kind)) return { ok: false, error: 'نوع القسم غير صالح.' };
  if (image === 'invalid') return { ok: false, error: 'رابط الصورة يجب أن يبدأ بـ https://' };
  if (!Number.isInteger(input.sort_order)) return { ok: false, error: 'ترتيب القسم غير صالح.' };

  const row = {
    slug,
    name_ar: name,
    kind: input.kind,
    sort_order: input.sort_order,
    is_visible: Boolean(input.is_visible),
    image_url: image,
  };

  const q = input.id && UUID.test(input.id)
    ? g.supabase.from('categories').update(row).eq('id', input.id)
    : g.supabase.from('categories').insert(row);
  const { error } = await q;
  if (error) {
    return {
      ok: false,
      error: error.message.includes('duplicate') ? 'الرابط المختصر مستخدم بالفعل لقسم آخر.' : 'تعذر حفظ القسم.',
    };
  }
  revalidateStore();
  revalidatePath('/dark-control/categories');
  return { ok: true, message: 'تم حفظ القسم.' };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id)) return { ok: false, error: 'القسم غير صالح.' };

  // Deleting a category cascades to its products, so refuse while products still exist.
  const { count } = await g.supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: 'لا يمكن حذف قسم يحتوي على منتجات. انقل المنتجات أو احذفها أولًا، أو أخفِ القسم.' };
  }

  const { error } = await g.supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, error: 'تعذر حذف القسم.' };
  revalidateStore();
  revalidatePath('/dark-control/categories');
  return { ok: true, message: 'تم حذف القسم.' };
}

// ---------- Products ----------
export type ProductInput = {
  id?: string;
  category_id: string | null;
  name_ar: string;
  description_ar?: string | null;
  image_url?: string | null;
  price_cents: number;
  old_price_cents?: number | null;
  is_offer: boolean;
  is_active: boolean;
  sort_order: number;
};

export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;

  const name = cleanText(input.name_ar, 120);
  if (!name) return { ok: false, error: 'اكتب اسم المنتج (حتى 120 حرفًا).' };
  if (!isCents(input.price_cents)) return { ok: false, error: 'السعر غير صالح.' };
  if (input.category_id && !UUID.test(input.category_id)) return { ok: false, error: 'القسم غير صالح.' };
  const image = cleanOptionalUrl(input.image_url);
  if (image === 'invalid') return { ok: false, error: 'رابط الصورة يجب أن يبدأ بـ https://' };

  let oldPrice: number | null = null;
  if (input.is_offer) {
    if (!isCents(input.old_price_cents ?? undefined) || (input.old_price_cents as number) <= input.price_cents) {
      return { ok: false, error: 'في العروض، يجب أن يكون السعر القديم أكبر من السعر الحالي.' };
    }
    oldPrice = input.old_price_cents as number;
  }

  const row = {
    category_id: input.category_id || null,
    name_ar: name,
    description_ar: cleanText(input.description_ar ?? '', 600),
    image_url: image,
    price_cents: input.price_cents,
    old_price_cents: oldPrice,
    is_offer: Boolean(input.is_offer),
    is_active: Boolean(input.is_active),
    sort_order: Number.isInteger(input.sort_order) ? input.sort_order : 0,
  };

  const q = input.id && UUID.test(input.id)
    ? g.supabase.from('products').update(row).eq('id', input.id)
    : g.supabase.from('products').insert(row);
  const { error } = await q;
  if (error) return { ok: false, error: 'تعذر حفظ المنتج.' };
  revalidateStore();
  revalidatePath('/dark-control/products');
  return { ok: true, message: 'تم حفظ المنتج.' };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id)) return { ok: false, error: 'المنتج غير صالح.' };
  // Existing orders keep their name and price snapshot (product_id becomes null).
  const { error } = await g.supabase.from('products').delete().eq('id', id);
  if (error) return { ok: false, error: 'تعذر حذف المنتج.' };
  revalidateStore();
  revalidatePath('/dark-control/products');
  return { ok: true, message: 'تم حذف المنتج.' };
}

// ---------- Homepage sections ----------
export type SectionInput = {
  id?: string;
  kind: string;
  title_ar: string | null;
  content: Record<string, string>;
  is_visible: boolean;
};

const CONTENT_KEYS = ['eyebrow', 'subtitle', 'button_text', 'button_href', 'category_slug', 'body', 'image_url', 'alt'];

export async function saveSectionAction(input: SectionInput): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;

  if (!(SECTION_KINDS as readonly string[]).includes(input.kind)) return { ok: false, error: 'نوع القسم غير صالح.' };

  const content: Record<string, string> = {};
  for (const key of CONTENT_KEYS) {
    const raw = input.content?.[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;
    if (value.length > 2000) return { ok: false, error: 'أحد الحقول أطول من المسموح.' };
    content[key] = value;
  }
  if (content.button_href && !(content.button_href.startsWith('/') || content.button_href.startsWith('https://'))) {
    return { ok: false, error: 'رابط الزر يجب أن يبدأ بـ / للصفحات الداخلية أو https:// للروابط الخارجية.' };
  }
  if (content.image_url && !content.image_url.startsWith('https://')) {
    return { ok: false, error: 'رابط الصورة يجب أن يبدأ بـ https://' };
  }

  const title = cleanText(input.title_ar ?? '', 120);

  if (input.id && UUID.test(input.id)) {
    const { error } = await g.supabase
      .from('home_sections')
      .update({ kind: input.kind, title_ar: title, content, is_visible: Boolean(input.is_visible) })
      .eq('id', input.id);
    if (error) return { ok: false, error: 'تعذر حفظ القسم.' };
  } else {
    const { data: last } = await g.supabase
      .from('home_sections')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = ((last?.sort_order as number | undefined) ?? 0) + 10;
    const { error } = await g.supabase.from('home_sections').insert({
      kind: input.kind,
      title_ar: title,
      content,
      is_visible: Boolean(input.is_visible),
      sort_order: nextOrder,
    });
    if (error) return { ok: false, error: 'تعذر إضافة القسم.' };
  }

  revalidateStore();
  revalidatePath('/dark-control/sections');
  return { ok: true, message: 'تم حفظ القسم وظهر التغيير في الموقع.' };
}

export async function deleteSectionAction(id: string): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id)) return { ok: false, error: 'القسم غير صالح.' };
  const { error } = await g.supabase.from('home_sections').delete().eq('id', id);
  if (error) return { ok: false, error: 'تعذر حذف القسم.' };
  revalidateStore();
  revalidatePath('/dark-control/sections');
  return { ok: true, message: 'تم حذف القسم.' };
}

export async function moveSectionAction(id: string, direction: 'up' | 'down'): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id)) return { ok: false, error: 'القسم غير صالح.' };

  const { data } = await g.supabase
    .from('home_sections')
    .select('id, sort_order')
    .order('sort_order')
    .order('id');
  const list = (data ?? []) as { id: string; sort_order: number }[];
  const index = list.findIndex((s) => s.id === id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= list.length) return { ok: true };

  // Swap the two sort orders. Each update is a single row, so the swap stays consistent.
  const a = list[index];
  const b = list[target];
  const [r1, r2] = await Promise.all([
    g.supabase.from('home_sections').update({ sort_order: b.sort_order }).eq('id', a.id),
    g.supabase.from('home_sections').update({ sort_order: a.sort_order }).eq('id', b.id),
  ]);
  if (r1.error || r2.error) return { ok: false, error: 'تعذر تغيير الترتيب.' };
  revalidateStore();
  revalidatePath('/dark-control/sections');
  return { ok: true };
}

// ---------- Deposits ----------
export async function reviewDepositAction(id: string, approve: boolean): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id)) return { ok: false, error: 'الطلب غير صالح.' };

  const { error } = await g.supabase.rpc('review_deposit', { p_deposit_id: id, p_approve: approve });
  if (error) {
    if (error.message.includes('already reviewed')) return { ok: false, error: 'تمت مراجعة هذا الطلب من قبل.' };
    return { ok: false, error: 'تعذر تنفيذ المراجعة.' };
  }
  revalidatePath('/dark-control/deposits');
  revalidatePath('/wallet');
  return { ok: true, message: approve ? 'تم اعتماد الإيداع وإضافة الرصيد.' : 'تم رفض الإيداع.' };
}

export async function getProofUrlAction(
  path: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const g = await guard(STAFF_ROLES);
  if (!g.ok) return g;
  if (typeof path !== 'string' || path.includes('..') || path.length > 200) {
    return { ok: false, error: 'مسار الصورة غير صالح.' };
  }
  const { data, error } = await g.supabase.storage.from('deposit-proofs').createSignedUrl(path, 300);
  if (error || !data) return { ok: false, error: 'تعذر فتح الصورة.' };
  return { ok: true, url: data.signedUrl };
}

// ---------- Orders ----------
export async function updateOrderStatusAction(id: string, status: string): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(id) || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'البيانات غير صالحة.' };
  }
  const { error } = await g.supabase.from('orders').update({ status }).eq('id', id);
  if (error) return { ok: false, error: 'تعذر تحديث حالة الطلب.' };
  revalidatePath('/dark-control/orders');
  revalidatePath('/orders');
  return { ok: true, message: 'تم تحديث حالة الطلب.' };
}

// ---------- Users and balances ----------
export async function adjustBalanceAction(userId: string, deltaCents: number, reason: string): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(userId)) return { ok: false, error: 'المستخدم غير صالح.' };
  if (!Number.isInteger(deltaCents) || deltaCents === 0 || Math.abs(deltaCents) > MAX_CENTS) {
    return { ok: false, error: 'المبلغ غير صالح.' };
  }
  const why = cleanText(reason, 120);
  if (!why || why.length < 3) return { ok: false, error: 'اكتب سببًا واضحًا للتعديل (3 أحرف على الأقل).' };

  const { error } = await g.supabase.rpc('adjust_balance', {
    p_user: userId,
    p_delta: deltaCents,
    p_reason: why,
  });
  if (error) {
    if (error.message.includes('negative') || error.message.includes('balance_cents_check')) {
      return { ok: false, error: 'لا يمكن أن يصبح الرصيد سالبًا.' };
    }
    return { ok: false, error: 'تعذر تعديل الرصيد.' };
  }
  revalidatePath('/dark-control/users');
  revalidatePath('/wallet');
  return { ok: true, message: 'تم تعديل الرصيد وتسجيل الحركة.' };
}

export async function setRoleAction(userId: string, role: string): Promise<ActionResult> {
  const g = await guard(SUPER_ROLES);
  if (!g.ok) return g;
  if (!UUID.test(userId) || !(ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: 'البيانات غير صالحة.' };
  }
  if (userId === g.userId) return { ok: false, error: 'لا يمكنك تغيير دورك بنفسك.' };
  const { error } = await g.supabase.rpc('set_user_role', { p_user: userId, p_role: role });
  if (error) return { ok: false, error: 'تعذر تغيير الدور.' };
  revalidatePath('/dark-control/users');
  return { ok: true, message: 'تم تحديث الدور.' };
}

// ---------- Site settings ----------
export async function saveSettingAction(
  key: string,
  value: Record<string, string>,
): Promise<ActionResult> {
  const g = await guard(ADMIN_ROLES);
  if (!g.ok) return g;
  if (!(SETTING_KEYS as readonly string[]).includes(key)) return { ok: false, error: 'الإعداد غير معروف.' };

  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(value ?? {})) {
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (t.length > 500) return { ok: false, error: 'أحد الحقول أطول من المسموح.' };
    if (t) clean[k] = t;
  }
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    return { ok: false, error: 'البريد الإلكتروني غير صالح.' };
  }
  if (clean.whatsapp) clean.whatsapp = clean.whatsapp.replace(/\D/g, '');

  const { error } = await g.supabase
    .from('site_settings')
    .upsert({ key, value: clean, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: 'تعذر حفظ الإعداد.' };
  revalidatePath('/dark-control/settings');
  revalidatePath('/deposit');
  revalidatePath('/contact');
  return { ok: true, message: 'تم حفظ الإعداد.' };
}
