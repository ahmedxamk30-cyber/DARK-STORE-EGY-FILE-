'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteProductAction, saveProductAction } from '@/app/dark-control/actions';
import { formatMoney, parseAmountToCents } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import AuthMessage from '@/components/AuthMessage';

type FormState = {
  category_id: string;
  name_ar: string;
  description_ar: string;
  image_url: string;
  price: string;
  old_price: string;
  is_offer: boolean;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: FormState = {
  category_id: '', name_ar: '', description_ar: '', image_url: '',
  price: '', old_price: '', is_offer: false, is_active: true, sort_order: 0,
};

export default function ProductManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name_ar ?? 'بدون قسم';

  function startEdit(p: Product) {
    setEditing(p);
    setForm({
      category_id: p.category_id ?? '',
      name_ar: p.name_ar,
      description_ar: p.description_ar ?? '',
      image_url: p.image_url ?? '',
      price: (p.price_cents / 100).toString(),
      old_price: p.old_price_cents ? (p.old_price_cents / 100).toString() : '',
      is_offer: p.is_offer,
      is_active: p.is_active,
      sort_order: p.sort_order,
    });
    setMsg(null);
  }
  function reset() {
    setEditing(null);
    setForm({ ...EMPTY });
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const price = parseAmountToCents(form.price);
    if (price === null) return setMsg({ ok: false, text: 'أدخل سعرًا صحيحًا.' });
    const old = form.old_price ? parseAmountToCents(form.old_price) : null;
    if (form.old_price && old === null) return setMsg({ ok: false, text: 'السعر القديم غير صالح.' });

    setBusy(true);
    setMsg(null);
    const res = await saveProductAction({
      id: editing?.id,
      category_id: form.category_id || null,
      name_ar: form.name_ar,
      description_ar: form.description_ar || null,
      image_url: form.image_url || null,
      price_cents: price,
      old_price_cents: form.is_offer ? old : null,
      is_offer: form.is_offer,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
    });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم الحفظ.' } : { ok: false, text: res.error });
    if (res.ok) { reset(); router.refresh(); }
  }

  async function remove(p: Product) {
    if (!window.confirm(`حذف المنتج "${p.name_ar}"؟ الطلبات السابقة ستبقى محفوظة.`)) return;
    const res = await deleteProductAction(p.id);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم الحذف.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2';

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        {products.length === 0 && <p className="text-sm text-muted">لا توجد منتجات بعد.</p>}
        {products.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-bold">{p.name_ar}</p>
              <p className="text-xs text-muted">{catName(p.category_id)} · {p.is_offer ? 'عرض' : 'عادي'} · {p.is_active ? 'منشور' : 'مخفي'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span dir="ltr" className="font-bold text-gold">{formatMoney(p.price_cents)}</span>
              <button type="button" onClick={() => startEdit(p)} className="rounded-lg border border-border px-3 py-2 hover:border-gold">تعديل</button>
              <button type="button" onClick={() => remove(p)} className="rounded-lg border border-border px-3 py-2 text-red-400 hover:border-red-400">حذف</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="h-fit space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-bold">{editing ? 'تعديل منتج' : 'إضافة منتج'}</h2>
        {msg && <AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage>}
        <input className={input} placeholder="اسم المنتج" required maxLength={120} value={form.name_ar}
          onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <select className={input} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">بدون قسم</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
        <textarea className={input} rows={3} placeholder="الوصف (اختياري)" maxLength={600} value={form.description_ar}
          onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
        <input className={`${input} text-left`} dir="ltr" placeholder="السعر" inputMode="decimal" required value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_offer} onChange={(e) => setForm({ ...form, is_offer: e.target.checked })} />
          عرض (سعر مخفّض)
        </label>
        {form.is_offer && (
          <input className={`${input} text-left`} dir="ltr" placeholder="السعر القديم (أكبر من السعر)" inputMode="decimal"
            value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
        )}
        <input className={`${input} text-left`} dir="ltr" placeholder="https://… رابط الصورة (اختياري)" value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <input className={`${input} text-left`} dir="ltr" type="number" placeholder="ترتيب العرض" value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          منشور للزوار
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-gold px-4 py-2 font-bold text-black disabled:opacity-60">
            {busy ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
          {editing && <button type="button" onClick={reset} className="rounded-lg border border-border px-4 py-2">إلغاء</button>}
        </div>
      </form>
    </div>
  );
}
