import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl font-black text-gold">404</p>
      <h1 className="mt-4 text-xl font-bold">الصفحة غير موجودة</h1>
      <Link href="/" className="mt-6 inline-block rounded-lg border border-border px-6 py-3 hover:border-gold">
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
