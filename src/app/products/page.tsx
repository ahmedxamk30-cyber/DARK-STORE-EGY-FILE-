import LoadStatus from '@/components/LoadStatus';
import Notice from '@/components/Notice';
import PageHeader from '@/components/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import { loadProducts } from '@/lib/catalog';

export const metadata = { title: 'المنتجات' };

export default async function ProductsPage() {
  const products = await loadProducts();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="المنتجات" description="كل المنتجات المتاحة في المتجر." />
      {(!products.configured || products.failed) && <LoadStatus configured={products.configured} failed={products.failed} />}
      {products.configured && !products.failed && (
        products.data.length === 0
          ? <Notice title="لا توجد منتجات منشورة حاليًا">ستظهر المنتجات هنا بعد إضافتها من لوحة التحكم.</Notice>
          : <ProductGrid products={products.data} />
      )}
    </div>
  );
}
