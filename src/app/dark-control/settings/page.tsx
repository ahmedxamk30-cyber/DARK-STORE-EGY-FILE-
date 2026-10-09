import { notFound } from 'next/navigation';
import { getSession, ADMIN_ROLES } from '@/lib/auth';
import { loadSetting } from '@/lib/catalog';
import PageHeader from '@/components/PageHeader';
import SettingsForm from '../_components/SettingsForm';

export const metadata = { title: 'الإعدادات', robots: { index: false } };

export default async function SettingsAdmin() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.profile.role)) notFound();

  const payment = (await loadSetting<Record<string, string>>('payment_instructions')) ?? {};
  const contact = (await loadSetting<Record<string, string>>('contact')) ?? {};

  return (
    <div className="max-w-2xl space-y-8">
      <PageHeader title="الإعدادات" description="بيانات الدفع ووسائل التواصل التي تظهر للمستخدمين." />
      <SettingsForm
        settingKey="payment_instructions"
        title="بيانات الدفع"
        description="تظهر في صفحة إضافة الرصيد. يلزم رقم فودافون كاش أو بيانات بنكية لتفعيل الإيداع."
        initial={payment}
        fields={[
          { key: 'vodafone_cash_number', label: 'رقم فودافون كاش', ltr: true },
          { key: 'bank_details', label: 'بيانات التحويل البنكي', multiline: true },
          { key: 'note', label: 'ملاحظة للمستخدم', multiline: true },
        ]}
      />
      <SettingsForm
        settingKey="contact"
        title="وسائل التواصل"
        description="تظهر في صفحة تواصل مع المطور. اتركها فارغة لإخفائها."
        initial={contact}
        fields={[
          { key: 'email', label: 'البريد الإلكتروني', ltr: true },
          { key: 'whatsapp', label: 'واتساب (رمز الدولة والأرقام فقط)', ltr: true },
          { key: 'telegram', label: 'تيليجرام (بدون @)', ltr: true },
          { key: 'note', label: 'ملاحظة', multiline: true },
        ]}
      />
    </div>
  );
}
