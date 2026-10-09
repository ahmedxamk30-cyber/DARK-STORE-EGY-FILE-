import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { loadSetting } from '@/lib/catalog';
import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import DepositForm from './DepositForm';

export const metadata = { title: 'إضافة رصيد' };

type PaymentInstructions = {
  vodafone_cash_number?: string;
  bank_details?: string;
  note?: string;
};

export default async function DepositPage() {
  const session = await getSession();
  if (!session) redirect('/login?next=/deposit');

  const instructions = (await loadSetting<PaymentInstructions>('payment_instructions')) ?? {};
  const hasVodafone = Boolean(instructions.vodafone_cash_number?.trim());
  const hasBank = Boolean(instructions.bank_details?.trim());

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-8">
      <PageHeader title="إضافة رصيد" description="حوّل المبلغ بإحدى الطرق التالية، ثم أرسل إثبات التحويل للمراجعة." />

      {!hasVodafone && !hasBank ? (
        <Notice title="وسائل الدفع غير متاحة حاليًا">لم يتم إعداد أرقام الدفع بعد. حاول لاحقًا.</Notice>
      ) : (
        <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
          <h2 className="font-bold">بيانات التحويل</h2>
          {hasVodafone && (
            <p>
              فودافون كاش: <span dir="ltr" className="font-bold text-gold">{instructions.vodafone_cash_number}</span>
            </p>
          )}
          {hasBank && <p className="whitespace-pre-line leading-7">{instructions.bank_details}</p>}
          {instructions.note && <p className="whitespace-pre-line leading-7 text-muted">{instructions.note}</p>}
        </section>
      )}

      {(hasVodafone || hasBank) && (
        <section className="rounded-xl border border-border bg-card p-5">
          <DepositForm userId={session.user.id} hasVodafone={hasVodafone} hasBank={hasBank} />
        </section>
      )}
    </div>
  );
}
