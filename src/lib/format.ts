// Currency label used for display only. Change here if your store uses a different currency.
export const CURRENCY_LABEL = 'ج.م';

export function formatMoney(cents: number | string | null | undefined): string {
  const amount = Number(cents ?? 0) / 100;
  return `${amount.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ${CURRENCY_LABEL}`;
}

// Converts Arabic-Indic digits to Latin digits so inputs like "١٠٠" parse correctly.
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/٫/g, '.');
}

// Returns integer cents, or null when the input is not a valid positive amount.
export function parseAmountToCents(input: string): number | null {
  const normalized = normalizeDigits(input).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return cents > 0 ? cents : null;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}

// Only allow same-site relative redirects after login.
export function safeNextPath(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
