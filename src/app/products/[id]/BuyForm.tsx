'use client';

import Link from 'next/link';
import { useState } from 'react';
import { placeOrderAction } from '@/app/actions/shop';
import AuthMessage from '@/components/AuthMessage';

export default function BuyForm({ productId, signedIn }: { productId: string; signedIn: boolean }) {
  const [reference, setReference] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/products/${productId}`}
        className="inline-block rounded-lg bg-gold px-6 py-3 font-bold text-black hover:opacity-90"
      >
        سجّل الدخول للشراء
      </Link>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    const res = await placeOrderAction(productId, reference);
    setPending(false);
    if (res.ok) {
      setResult({ ok: true, text: res.message ?? 'تم استلام طلبك.' });
      setReference('');
    } else {
      setResult({ ok: false, text: res.error });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="ref" className="mb-1 block text-sm">معرّف اللاعب أو الحساب</label>
        <input
          id="ref"
          required
          minLength={2}
          maxLength={64}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          dir="ltr"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left"
        />
      </div>
      {result && <AuthMessage type={result.ok ? 'success' : 'error'}>{result.text}</AuthMessage>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold px-6 py-3 font-bold text-black disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'جارٍ إتمام الطلب…' : 'شراء الآن'}
      </button>
      {result?.ok === false && result.text.includes('رصيدك') && (
        <Link href="/deposit" className="block text-sm text-neon underline-offset-4 hover:underline">
          الانتقال إلى إضافة الرصيد
        </Link>
      )}
    </form>
  );
}
