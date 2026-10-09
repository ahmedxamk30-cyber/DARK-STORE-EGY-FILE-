import type { Deposit, Order, Role } from './types';

export const ORDER_STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const DEPOSIT_STATUS_LABEL: Record<Deposit['status'], string> = {
  pending: 'بانتظار المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export const DEPOSIT_METHOD_LABEL: Record<Deposit['method'], string> = {
  vodafone_cash: 'فودافون كاش',
  bank_transfer: 'تحويل بنكي',
  manual: 'تحويل يدوي',
};

export const ROLE_LABEL: Record<Role, string> = {
  user: 'مستخدم',
  support: 'دعم',
  admin: 'إدارة',
  super_admin: 'مالك',
};

export const KIND_LABEL: Record<'game' | 'social' | 'gift', string> = {
  game: 'ألعاب',
  social: 'سوشيال ميديا',
  gift: 'بطاقات هدايا',
};
