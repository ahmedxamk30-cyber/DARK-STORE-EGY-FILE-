import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import type { Category, HomeSection, Product } from '@/lib/types';

// Renders one homepage section. Used by the homepage and by the DARK CONTROL preview,
// so what the editor shows is what visitors see.
export default function SectionView({
  section,
  categories,
  products,
}: {
  section: HomeSection;
  categories: Category[];
  products: Product[];
}) {
  const c = section.content ?? {};

  switch (section.kind) {
    case 'hero':
      return (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 sm:p-14">
          {c.eyebrow && <p className="text-sm text-neon">{c.eyebrow}</p>}
          <h2 className="mt-4 text-4xl font-black leading-tight text-gold sm:text-6xl">{section.title_ar}</h2>
          {c.subtitle && <p className="mt-4 max-w-xl text-base leading-8 text-muted">{c.subtitle}</p>}
          {c.button_text && c.button_href && (
            <div className="mt-8">
              <Link href={c.button_href} className="inline-block rounded-lg bg-gold px-6 py-3 font-bold text-black hover:opacity-90">
                {c.button_text}
              </Link>
            </div>
          )}
        </section>
      );

    case 'categories':
      if (categories.length === 0) return null;
      return (
        <section>
          {section.title_ar && <h2 className="mb-5 text-xl font-bold">{section.title_ar}</h2>}
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={cat.kind === 'social' ? `/social#${cat.slug}` : `/games#${cat.slug}`}
                  className="block rounded-xl border border-border bg-card p-5 font-bold transition-colors duration-fast hover:border-gold"
                >
                  {cat.name_ar}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );

    case 'offers': {
      const offers = products.filter((p) => p.is_offer);
      if (offers.length === 0) return null;
      return (
        <section>
          {section.title_ar && <h2 className="mb-5 text-xl font-bold">{section.title_ar}</h2>}
          <ProductGrid products={offers.slice(0, 6)} />
        </section>
      );
    }

    case 'products': {
      const slug = c.category_slug;
      const categoryId = slug ? categories.find((cat) => cat.slug === slug)?.id : undefined;
      const items = products.filter((p) => (categoryId ? p.category_id === categoryId : true));
      if (items.length === 0) return null;
      return (
        <section>
          {section.title_ar && <h2 className="mb-5 text-xl font-bold">{section.title_ar}</h2>}
          <ProductGrid products={items.slice(0, 8)} />
        </section>
      );
    }

    case 'text':
      return (
        <section className="rounded-2xl border border-border p-6 sm:p-10">
          {section.title_ar && <h2 className="mb-3 text-xl font-bold">{section.title_ar}</h2>}
          {c.body && <p className="whitespace-pre-line leading-8 text-muted">{c.body}</p>}
        </section>
      );

    case 'image':
      if (!c.image_url) return null;
      return (
        <section>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image_url} alt={c.alt ?? section.title_ar ?? ''} loading="lazy" className="w-full rounded-2xl object-cover" />
        </section>
      );

    default:
      return null;
  }
}
