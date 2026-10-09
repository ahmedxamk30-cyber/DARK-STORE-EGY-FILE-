'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/format';
import AuthMessage from '@/components/AuthMessage';

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (message.includes('Email not confirmed')) return 'يجب تأكيد بريدك الإلكتروني أولًا. تحقق من صندوق الوارد.';
  return 'تعذر تسجيل الدخول. حاول مرة أخرى.';
}

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(translateAuthError(signInError.message));
        return;
      }
      router.replace(safeNextPath(params.get('next'), '/'));
      router.refresh();
    } catch {
      setError('تعذر الاتصال بالخادم. تأكد من إعداد Supabase وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <AuthMessage type="error">{error}</AuthMessage>}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm">البريد الإلكتروني</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm">كلمة المرور</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-3 font-bold text-black disabled:opacity-60"
      >
        {loading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
      </button>
      <p className="text-center text-sm text-muted">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="text-neon underline-offset-4 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </form>
  );
}
