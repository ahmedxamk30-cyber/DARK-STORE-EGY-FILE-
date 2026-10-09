import CategoryGroups from '@/components/CategoryGroups';
import LoadStatus from '@/components/LoadStatus';
import PageHeader from '@/components/PageHeader';
import { loadCategories, loadProducts } from '@/lib/catalog';

export const metadata = { title: 'خدمات السوشيال ميديا' };

export default async function SocialPage() {
  const [cats, prods] = await Promise.all([loadCategories('social'), loadProducts()]);
  const failed = cats.failed || prods.failed;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="خدمات السوشيال ميديا" description="خدمات تفاعل ومتابعة للمنصات الاجتماعية." />
      {(!cats.configured || failed) ? (
        <LoadStatus configured={cats.configured} failed={failed} />
      ) : (
        <CategoryGroups categories={cats.data} products={prods.data} emptyTitle="لا توجد خدمات منشورة حاليًا" />
      )}
    </div>
  );
}
