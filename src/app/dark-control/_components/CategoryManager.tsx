'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteCategoryAction, saveCategoryAction } from '@/app/dark-control/actions';
import { KIND_LABEL } from '@/lib/labels';
import type { Category } from '@/lib/types';
import AuthMessage from '@/components/AuthMessage';

const EMPTY = { slug: '', name_ar: '', kind: 'game', sort_order: 0, is_visible: true, image_url: '' };

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function startEdit(c: Category) {
    setEditing(c);
    setForm({ slug: c.slug, name_ar: c.name_ar, kind: c.kind, sort_order: c.sort_order, is_visible: c.is_visible, image_url: c.image_url ?? '' });
    setMsg(null);
  }
  function reset() {
    setEditing(null);
    setForm({ ...EMPTY });
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveCategoryAction({
      id: editing?.id,
      slug: form.slug,
      name_ar: form.name_ar,
      kind: form.kind,
      sort_order: Number(form.sort_order) || 0,
      is_visible: form.is_visible,
      image_url: form.image_url || null,
    });
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم الحفظ.' } : { ok: false, text: res.error });
    if (res.ok) {
      reset();
      router.refresh();
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`حذف القسم "${c.name_ar}"؟`)) return;
    const res = await deleteCategoryAction(c.id);
    setMsg(res.ok ? { ok: true, text: res.message ?? 'تم الحذف.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2';

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {categories.length === 0 && <p className="text-sm text-muted">لا توجد أقسام بعد.</p>}
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-bold">{c.name_ar}</p>
              <p className="text-xs text-muted" dir="ltr">{c.slug} · {KIND_LABEL[c.kind]} · ترتيب {c.sort_order}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs ${c.is_visible ? 'text-neon' : 'text-muted'}`}>
                {c.is_visible ? 'ظاهر' : 'مخفي'}
              </span>
              <button type="button" onClick={() => startEdit(c)} className="rounded-lg border border-border px-3 py-2 hover:border-gold">تعديل</button>
              <button type="button" onClick={() => remove(c)} className="rounded-lg border border-border px-3 py-2 text-red-400 hover:border-red-400">حذف</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="h-fit space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-bold">{editing ? 'تعديل قسم' : 'إضافة قسم'}</h2>
        {msg && <AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage>}
        <input className={input} placeholder="اسم القسم" required maxLength={80} value={form.name_ar}
          onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        <input className={`${input} text-left`} dir="ltr" placeholder="slug-مثال" required value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
        <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="game">ألعاب</option>
          <option value="social">سوشيال ميديا</option>
          <option value="gift">بطاقات هدايا</option>
        </select>
        <input className={`${input} text-left`} dir="ltr" type="number" placeholder="ترتيب العرض" value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <input className={`${input} text-left`} dir="ltr" placeholder="https://… (اختياري)" value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
          ظاهر للزوار
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
