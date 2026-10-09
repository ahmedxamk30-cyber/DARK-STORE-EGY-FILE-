import ProductGrid from './ProductGrid';
import Notice from './Notice';
import type { Category, Product } from '@/lib/types';

// Groups products under their categories. Each category gets an id (its slug) for in-page links.
export default function CategoryGroups({
  categories,
  products,
  emptyTitle,
}: {
  categories: Category[];
  products: Product[];
  emptyTitle: string;
}) {
  if (categories.length === 0) {
    return <Notice title={emptyTitle}>لم تُنشر أقسام في هذا القسم بعد.</Notice>;
  }

  return (
    <div className="space-y-12">
      {categories.map((category) => {
        const items = products.filter((p) => p.category_id === category.id);
        return (
          <section key={category.id} id={category.slug} aria-labelledby={`cat-${category.id}`} className="scroll-mt-24">
            <h2 id={`cat-${category.id}`} className="mb-4 text-xl font-bold">
              {category.name_ar}
            </h2>
            {items.length === 0 ? (
              <p className="rounded-xl border border-border p-5 text-sm text-muted">لا توجد منتجات في هذا القسم حاليًا.</p>
            ) : (
              <ProductGrid products={items} />
            )}
          </section>
        );
      })}
    </div>
  );
}
