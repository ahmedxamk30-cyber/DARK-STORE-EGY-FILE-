import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import { loadSetting } from '@/lib/catalog';

export const metadata = { title: 'تواصل مع المطور' };

type Contact = {
  email?: string;
  whatsapp?: string; // digits only, with country code
  telegram?: string; // username without @
  note?: string;
};

export default async function ContactPage() {
  const contact = (await loadSetting<Contact>('contact')) ?? {};
  const email = contact.email?.trim();
  const whatsapp = contact.whatsapp?.replace(/\D/g, '');
  const telegram = contact.telegram?.trim().replace(/^@/, '');
  const hasAny = Boolean(email || whatsapp || telegram);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
      <PageHeader title="تواصل مع المطور" description="للاستفسارات والمشكلات المتعلقة بالطلبات والرصيد." />

      {!hasAny ? (
        <Notice title="لم تُضف وسائل التواصل بعد">تظهر وسائل التواصل هنا بعد إضافتها من لوحة التحكم.</Notice>
      ) : (
        <ul className="space-y-3">
          {email && (
            <li>
              <a href={`mailto:${email}`} className="block rounded-xl border border-border bg-card p-5 hover:border-gold">
                البريد الإلكتروني: <span dir="ltr" className="font-bold">{email}</span>
              </a>
            </li>
          )}
          {whatsapp && (
            <li>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl border border-border bg-card p-5 hover:border-gold">
                واتساب: <span dir="ltr" className="font-bold">+{whatsapp}</span>
              </a>
            </li>
          )}
          {telegram && (
            <li>
              <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl border border-border bg-card p-5 hover:border-gold">
                تيليجرام: <span dir="ltr" className="font-bold">@{telegram}</span>
              </a>
            </li>
          )}
        </ul>
      )}
      {contact.note && <p className="mt-6 whitespace-pre-line leading-7 text-muted">{contact.note}</p>}
    </div>
  );
}
