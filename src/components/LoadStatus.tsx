import Notice from './Notice';

// Shared handling for "not configured" and "failed to load" states.
export default function LoadStatus({ configured, failed }: { configured: boolean; failed: boolean }) {
  if (!configured) {
    return (
      <Notice title="قاعدة البيانات غير متصلة">
        أضف متغيرات Supabase في ملف البيئة لعرض البيانات الحقيقية.
      </Notice>
    );
  }
  if (failed) {
    return <Notice title="تعذر تحميل البيانات">حدث خطأ أثناء الاتصال بالخادم. حاول تحديث الصفحة.</Notice>;
  }
  return null;
}
