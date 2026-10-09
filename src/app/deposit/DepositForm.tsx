'use client';

import { useState } from 'react';
import { createDepositAction } from '@/app/actions/shop';
import { createClient } from '@/lib/supabase/client';
import { parseAmountToCents } from '@/lib/format';
import AuthMessage from '@/components/AuthMessage';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TYPE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default function DepositForm({
  userId,
  hasVodafone,
  hasBank,
}: {
  userId: string;
  hasVodafone: boolean;
  hasBank: boolean;
}) {
  const methods = [
    ...(hasVodafone ? [{ value: 'vodafone_cash', label: 'فودافون كاش' }] : []),
    ...(hasBank ? [{ value: 'bank_transfer', label: 'تحويل بنكي' }] : []),
  ];

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(methods[0]?.value ?? '');
  const [payer, setPayer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const cents = parseAmountToCents(amount);
    if (!cents) return setResult({ ok: false, text: 'أدخل مبلغًا صحيحًا أكبر من صفر.' });
    if (!file) return setResult({ ok: false, text: 'ارفع صورة إثبات التحويل.' });
    if (!TYPE_EXT[file.type]) return setResult({ ok: false, text: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.' });
    if (file.size > MAX_FILE_BYTES) return setResult({ ok: false, text: 'حجم الصورة أكبر من 5 ميجابايت.' });

    setPending(true);
    try {
      const supabase = createClient();
      // Random name inside the user's own folder; the server re-checks the prefix.
      const path = `${userId}/${crypto.randomUUID()}.${TYPE_EXT[file.type]}`;
      const { error: uploadError } = await supabase.storage
        .from('deposit-proofs')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setResult({ ok: false, text: 'تعذر رفع الصورة. حاول مرة أخرى.' });
        return;
      }

      const res = await createDepositAction({
        amountCents: cents,
        method,
        payerReference: payer,
        proofPath: path,
      });
      if (res.ok) {
        setResult({ ok: true, text: res.message ?? 'تم إرسال الطلب.' });
        setAmount('');
        setPayer('');
        setFile(null);
      } else {
        setResult({ ok: false, text: res.error });
      }
    } catch {
      setResult({ ok: false, text: 'حدث خطأ غير متوقع. حاول مرة أخرى.' });
    } finally {
      setPending(false);
    }
  }

  if (methods.length === 0) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {result && <AuthMessage type={result.ok ? 'success' : 'error'}>{result.text}</AuthMessage>}

      <div>
        <label htmlFor="amount" className="mb-1 block text-sm">المبلغ</label>
        <input id="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)}
          dir="ltr" placeholder="0.00" className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left" />
      </div>

      <div>
        <label htmlFor="method" className="mb-1 block text-sm">طريقة التحويل</label>
        <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3">
          {methods.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="payer" className="mb-1 block text-sm">رقم العملية أو رقم المرسل</label>
        <input id="payer" value={payer} onChange={(e) => setPayer(e.target.value)} maxLength={64}
          dir="ltr" className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left" />
      </div>

      <div>
        <label htmlFor="proof" className="mb-1 block text-sm">صورة إثبات التحويل</label>
        <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm file:me-4 file:rounded-lg file:border-0 file:bg-gold/20 file:px-4 file:py-2 file:text-fg" />
        <p className="mt-1 text-xs text-muted">JPG أو PNG أو WebP، بحد أقصى 5 ميجابايت.</p>
      </div>

      <button type="submit" disabled={pending}
        className="w-full rounded-lg bg-gold px-6 py-3 font-bold text-black disabled:opacity-60 sm:w-auto">
        {pending ? 'جارٍ الإرسال…' : 'إرسال طلب الإيداع'}
      </button>
      <p className="text-xs text-muted">لن يُضاف الرصيد إلا بعد مراجعة التحويل واعتماده.</p>
    </form>
  );
}
