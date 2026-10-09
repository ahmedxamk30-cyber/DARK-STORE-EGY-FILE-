import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import AuthMessage from '@/components/AuthMessage';

export const metadata = { title: 'تسجيل الدخول' };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="mb-8 text-2xl font-black text-gold">تسجيل الدخول</h1>
      {!isSupabaseConfigured() ? (
        <AuthMessage type="info">تسجيل الدخول غير متاح حاليًا لأن قاعدة البيانات لم تُربط بعد.</AuthMessage>
      ) : (
        <Suspense fallback={<p className="text-muted">جارٍ التحميل…</p>}>
          <LoginForm />
        </Suspense>
      )}
    </div>
  );
}
