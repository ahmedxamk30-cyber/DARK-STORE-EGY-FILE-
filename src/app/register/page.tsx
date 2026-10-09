import RegisterForm from './RegisterForm';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import AuthMessage from '@/components/AuthMessage';

export const metadata = { title: 'إنشاء حساب' };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <h1 className="mb-8 text-2xl font-black text-gold">إنشاء حساب</h1>
      {isSupabaseConfigured() ? (
        <RegisterForm />
      ) : (
        <AuthMessage type="info">التسجيل غير متاح حاليًا لأن قاعدة البيانات لم تُربط بعد.</AuthMessage>
      )}
    </div>
  );
}
