import Link from 'next/link';
import SectionView from '@/components/sections/SectionView';
import LoadStatus from '@/components/LoadStatus';
import { loadCategories, loadHomeSections, loadProducts } from '@/lib/catalog';

export default async function HomePage() {
  const [sectionsRes, categoriesRes, productsRes] = await Promise.all([
    loadHomeSections(),
    loadCategories(),
    loadProducts(),
  ]);

  const configured = sectionsRes.configured;
  const failed = sectionsRes.failed || categoriesRes.failed || productsRes.failed;

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-8 lg:py-14">
      {(!configured || failed) && <LoadStatus configured={configured} failed={failed} />}

      {configured && !failed && sectionsRes.data.length === 0 && (
        // Built-in fallback layout until the owner adds sections in DARK CONTROL.
        <section className="rounded-2xl border border-border bg-card p-8 sm:p-14">
          <h1 className="text-4xl font-black text-gold sm:text-6xl">DARK STORE</h1>
          <p className="mt-4 max-w-xl leading-8 text-muted">
            اشحن ألعابك المفضلة، واطلب خدمات السوشيال ميديا، وتابع طلباتك من مكان واحد.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/games" className="rounded-lg bg-gold px-6 py-3 font-bold text-black hover:opacity-90">تصفح الألعاب</Link>
            <Link href="/offers" className="rounded-lg border border-neon px-6 py-3 font-bold text-neon hover:bg-neon/10">العروض</Link>
          </div>
        </section>
      )}

      {sectionsRes.data.map((section) => (
        <SectionView
          key={section.id}
          section={section}
          categories={categoriesRes.data}
          products={productsRes.data}
        />
      ))}
    </div>
  );
}
