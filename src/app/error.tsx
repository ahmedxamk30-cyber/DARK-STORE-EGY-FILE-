'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-black text-gold">حدث خطأ غير متوقع</h1>
      <p className="mt-3 text-sm text-muted">لم يتم تنفيذ العملية. حاول مرة أخرى.</p>
      <button type="button" onClick={reset}
        className="mt-6 rounded-lg bg-gold px-6 py-3 font-bold text-black">
        إعادة المحاولة
      </button>
    </div>
  );
}
