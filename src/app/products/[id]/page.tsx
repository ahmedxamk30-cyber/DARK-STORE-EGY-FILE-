import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { loadProduct } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';
import LoadStatus from '@/components/LoadStatus';
import BuyForm from './BuyForm';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data } = await loadProduct(params.id).catch(() => ({ data: null }));
  return { title: data?.name_ar ?? 'المنتج' };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const [product, session] = await Promise.all([loadProduct(params.id), getSession()]);

  if (!product.configured || product.failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
        <LoadStatus configured={product.configured} failed={product.failed} />
      </div>
    );
  }
  if (!product.data) notFound();

  const p = product.data;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {p.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" className="aspect-video w-full object-cover" />
        )}
        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">{p.name_ar}</h1>
            {p.description_ar && <p className="mt-3 leading-8 text-muted">{p.description_ar}</p>}
          </div>
          <div className="flex items-baseline gap-3" dir="ltr">
            <span className="text-3xl font-black text-gold">{formatMoney(p.price_cents)}</span>
            {p.is_offer && p.old_price_cents && p.old_price_cents > p.price_cents && (
              <span className="text-muted line-through">{formatMoney(p.old_price_cents)}</span>
            )}
          </div>
          <p className="text-sm text-muted">
            يُخصم السعر من رصيدك في المحفظة عند إتمام الطلب، ويتم التحقق من الرصيد على الخادم.
          </p>
          <BuyForm productId={p.id} signedIn={Boolean(session)} />
        </div>
      </div>
    </div>
  );
}
