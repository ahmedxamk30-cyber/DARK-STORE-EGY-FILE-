import LoadStatus from '@/components/LoadStatus';
import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import { loadProducts } from '@/lib/catalog';

export const metadata = { title: 'العروض' };

export default async function OffersPage() {
  const offers = await loadProducts({ offersOnly: true });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="العروض" description="منتجات بأسعار مخفضة لفترة محدودة." />
      {(!offers.configured || offers.failed) && <LoadStatus configured={offers.configured} failed={offers.failed} />}
      {offers.configured && !offers.failed && (
        offers.data.length === 0
          ? <Notice title="لا توجد عروض حاليًا">تابع الصفحة لاحقًا.</Notice>
          : <ProductGrid products={offers.data} />
      )}
    </div>
  );
}
