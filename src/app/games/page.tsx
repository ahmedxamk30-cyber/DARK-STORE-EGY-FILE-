import CategoryGroups from '@/components/CategoryGroups';
import LoadStatus from '@/components/LoadStatus';
import PageHeader from '@/components/PageHeader';
import { loadCategories, loadProducts } from '@/lib/catalog';

export const metadata = { title: 'الألعاب' };

export default async function GamesPage() {
  const [cats, prods] = await Promise.all([loadCategories('game'), loadProducts()]);
  const failed = cats.failed || prods.failed;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <PageHeader title="الألعاب" description="اختر اللعبة وحدد الباقة المناسبة لك." />
      {(!cats.configured || failed) ? (
        <LoadStatus configured={cats.configured} failed={failed} />
      ) : (
        <CategoryGroups categories={cats.data} products={prods.data} emptyTitle="لا توجد ألعاب منشورة حاليًا" />
      )}
    </div>
  );
}
