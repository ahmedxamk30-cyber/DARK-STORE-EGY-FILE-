'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AuthMessage from '@/components/AuthMessage';

export default function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.'
            : 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.',
        );
        return;
      }
      setDone(
        data.session
          ? 'تم إنشاء الحساب وتسجيل دخولك.'
          : 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده ثم سجّل الدخول.',
      );
    } catch {
      setError('تعذر الاتصال بالخادم. تأكد من إعداد Supabase وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <AuthMessage type="success">{done}</AuthMessage>
        <Link href="/login" className="block text-center text-neon underline-offset-4 hover:underline">
          الذهاب إلى تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <AuthMessage type="error">{error}</AuthMessage>}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm">الاسم</label>
        <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)}
          autoComplete="name" className="w-full rounded-lg border border-border bg-bg px-4 py-3" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm">البريد الإلكتروني</label>
        <input id="email" type="email" required dir="ltr" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm">كلمة المرور (8 أحرف على الأقل)</label>
        <input id="password" type="password" required dir="ltr" autoComplete="new-password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-left" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-gold px-4 py-3 font-bold text-black disabled:opacity-60">
        {loading ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب'}
      </button>
      <p className="text-center text-sm text-muted">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-neon underline-offset-4 hover:underline">تسجيل الدخول</Link>
      </p>
    </form>
  );
}
