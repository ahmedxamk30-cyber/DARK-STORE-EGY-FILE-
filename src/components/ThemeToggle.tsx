'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('dark-store-theme', next ? 'dark' : 'light');
    } catch {
      // Storage may be blocked; the theme still applies for this visit.
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      className="rounded-lg border border-border px-3 py-2 text-sm transition-colors duration-fast hover:border-gold"
    >
      {isDark ? 'وضع فاتح' : 'وضع داكن'}
    </button>
  );
}
