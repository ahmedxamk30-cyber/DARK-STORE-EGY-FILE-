import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const hasOldPrice = product.is_offer && product.old_price_cents && product.old_price_cents > product.price_cents;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors duration-fast hover:border-gold focus-visible:border-gold"
    >
      <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg bg-bg">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">بدون صورة</div>
        )}
      </div>
      <h3 className="font-bold leading-7">{product.name_ar}</h3>
      {product.description_ar && (
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description_ar}</p>
      )}
      <div className="mt-auto flex items-baseline gap-3 pt-4" dir="ltr">
        <span className="font-black text-gold">{formatMoney(product.price_cents)}</span>
        {hasOldPrice && (
          <span className="text-sm text-muted line-through">{formatMoney(product.old_price_cents)}</span>
        )}
      </div>
    </Link>
  );
}
