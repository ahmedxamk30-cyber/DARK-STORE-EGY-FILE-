'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteSectionAction, moveSectionAction, saveSectionAction } from '@/app/dark-control/actions';
import SectionView from '@/components/sections/SectionView';
import AuthMessage from '@/components/AuthMessage';
import type { Category, HomeSection, Product } from '@/lib/types';

const KINDS = [
  { value: 'hero', label: 'واجهة رئيسية' },
  { value: 'categories', label: 'الأقسام' },
  { value: 'offers', label: 'العروض' },
  { value: 'products', label: 'منتجات' },
  { value: 'text', label: 'نص' },
  { value: 'image', label: 'صورة' },
];

// Which content fields each section kind uses.
const FIELDS: Record<string, { key: string; label: string; multiline?: boolean; ltr?: boolean }[]> = {
  hero: [
    { key: 'eyebrow', label: 'سطر صغير فوق العنوان' },
    { key: 'subtitle', label: 'الوصف', multiline: true },
    { key: 'button_text', label: 'نص الزر' },
    { key: 'button_href', label: 'رابط الزر (مثل /games أو https://…)', ltr: true },
  ],
  categories: [],
  offers: [],
  products: [{ key: 'category_slug', label: 'رابط القسم المختصر (اختياري، فارغ = كل المنتجات)', ltr: true }],
  text: [{ key: 'body', label: 'النص', multiline: true }],
  image: [
    { key: 'image_url', label: 'رابط الصورة (https://…)', ltr: true },
    { key: 'alt', label: 'وصف الصورة' },
  ],
};

export default function SectionEditor({
  sections,
  categories,
  products,
}: {
  sections: HomeSection[];
  categories: Category[];
  products: Product[];
}) {
  const router = useRouter();
  const [newKind, setNewKind] = useState('text');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function addSection() {
    const res = await saveSectionAction({
      kind: newKind,
      title_ar: 'قسم جديد',
      content: {},
      is_visible: false, // hidden until the owner fills it in and shows it
    });
    setMsg(res.ok ? { ok: true, text: 'تمت إضافة القسم مخفيًا. عدّل محتواه ثم أظهره.' } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  async function move(id: string, dir: 'up' | 'down') {
    const res = await moveSectionAction(id, dir);
    if (!res.ok) setMsg({ ok: false, text: res.error });
    else router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label htmlFor="newkind" className="mb-1 block text-sm">نوع القسم الجديد</label>
          <select id="newkind" value={newKind} onChange={(e) => setNewKind(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2">
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={addSection} className="rounded-lg bg-gold px-4 py-2 font-bold text-black">
          إضافة قسم
        </button>
        <p className="text-xs text-muted">التغييرات تُنشر مباشرة بعد الحفظ. لا توجد مسودة منفصلة.</p>
      </div>

      {msg && <AuthMessage type={msg.ok ? 'success' : 'error'}>{msg.text}</AuthMessage>}

      {sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
          لا توجد أقسام في الصفحة الرئيسية. الموقع يعرض التخطيط الافتراضي حتى تضيف أقسامًا.
        </p>
      )}

      {sections.map((s, i) => (
        <SectionRow
          key={s.id}
          section={s}
          isFirst={i === 0}
          isLast={i === sections.length - 1}
          categories={categories}
          products={products}
          onMove={move}
          onChanged={() => router.refresh()}
          onMessage={setMsg}
        />
      ))}
    </div>
  );
}

function SectionRow({
  section,
  isFirst,
  isLast,
  categories,
  products,
  onMove,
  onChanged,
  onMessage,
}: {
  section: HomeSection;
  isFirst: boolean;
  isLast: boolean;
  categories: Category[];
  products: Product[];
  onMove: (id: string, dir: 'up' | 'down') => void;
  onChanged: () => void;
  onMessage: (m: { ok: boolean; text: string } | null) => void;
}) {
  const [kind, setKind] = useState(section.kind);
  const [title, setTitle] = useState(section.title_ar ?? '');
  const [visible, setVisible] = useState(section.is_visible);
  const [content, setContent] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(section.content ?? {}).map(([k, v]) => [k, v ?? ''])),
  );
  const [busy, setBusy] = useState(false);

  const fields = FIELDS[kind] ?? [];
  const draft: HomeSection = { ...section, kind: kind as HomeSection['kind'], title_ar: title, content, is_visible: visible };

  async function save() {
    setBusy(true);
    const res = await saveSectionAction({ id: section.id, kind, title_ar: title || null, content, is_visible: visible });
    setBusy(false);
    onMessage(res.ok ? { ok: true, text: res.message ?? 'تم الحفظ.' } : { ok: false, text: res.error });
    if (res.ok) onChanged();
  }

  async function remove() {
    if (!window.confirm('حذف هذا القسم من الصفحة الرئيسية؟')) return;
    const res = await deleteSectionAction(section.id);
    onMessage(res.ok ? { ok: true, text: 'تم حذف القسم.' } : { ok: false, text: res.error });
    if (res.ok) onChanged();
  }

  const input = 'w-full rounded-lg border border-border bg-bg px-3 py-2';

  return (
    <article className="grid gap-6 rounded-2xl border border-border bg-card p-5 xl:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">{KINDS.find((k) => k.value === kind)?.label ?? kind}</p>
          <div className="flex gap-1 text-sm">
            <button type="button" disabled={isFirst} onClick={() => onMove(section.id, 'up')}
              aria-label="تحريك لأعلى" className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">▲</button>
            <button type="button" disabled={isLast} onClick={() => onMove(section.id, 'down')}
              aria-label="تحريك لأسفل" className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">▼</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">نوع القسم</label>
            <select className={input} value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">العنوان</label>
            <input className={input} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-sm">{f.label}</label>
            {f.multiline ? (
              <textarea className={input} rows={3} value={content[f.key] ?? ''}
                onChange={(e) => setContent({ ...content, [f.key]: e.target.value })} />
            ) : (
              <input className={`${input} ${f.ltr ? 'text-left' : ''}`} dir={f.ltr ? 'ltr' : undefined}
                value={content[f.key] ?? ''} onChange={(e) => setContent({ ...content, [f.key]: e.target.value })} />
            )}
          </div>
        ))}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          ظاهر للزوار
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={save} disabled={busy}
            className="rounded-lg bg-gold px-4 py-2 font-bold text-black disabled:opacity-60">
            {busy ? 'جارٍ الحفظ…' : 'حفظ ونشر'}
          </button>
          <button type="button" onClick={remove} className="rounded-lg border border-border px-4 py-2 text-red-400">
            حذف
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted">معاينة فورية (تعكس ما تكتبه قبل الحفظ)</p>
        <div className="rounded-xl border border-dashed border-border bg-bg p-3">
          {visible ? (
            <SectionView section={draft} categories={categories} products={products} />
          ) : (
            <p className="p-6 text-center text-sm text-muted">القسم مخفي ولن يظهر للزوار.</p>
          )}
        </div>
      </div>
    </article>
  );
}
