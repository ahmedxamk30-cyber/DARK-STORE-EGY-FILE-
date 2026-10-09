'use server';

import { revalidatePath } from 'next/cache';
import { getActionContext } from '@/lib/auth';
import type { ActionResult } from '@/lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEPOSIT_METHODS = ['vodafone_cash', 'bank_transfer', 'manual'] as const;
const MAX_DEPOSIT_CENTS = 100000000; // 1,000,000 currency units per request

// The client sends only the product id and the player reference.
// Price and balance are read and checked inside place_order() in the database.
export async function placeOrderAction(productId: string, playerReference: string): Promise<ActionResult> {
  if (typeof productId !== 'string' || !UUID.test(productId)) {
    return { ok: false, error: 'المنتج غير صالح.' };
  }
  const reference = typeof playerReference === 'string' ? playerReference.trim() : '';
  if (reference.length < 2 || reference.length > 64) {
    return { ok: false, error: 'أدخل معرّف اللاعب أو الحساب (بين 2 و 64 حرفًا).' };
  }

  const ctx = await getActionContext();
  if (!ctx) return { ok: false, error: 'يجب تسجيل الدخول أولًا.' };

  const { error } = await ctx.supabase.rpc('place_order', {
    p_product_id: productId,
    p_player_reference: reference,
  });

  if (error) {
    if (error.message.includes('insufficient balance')) {
      return { ok: false, error: 'رصيدك غير كافٍ لإتمام هذا الطلب. أضف رصيدًا ثم حاول مرة أخرى.' };
    }
    if (error.message.includes('product not available')) {
      return { ok: false, error: 'هذا المنتج غير متاح حاليًا.' };
    }
    return { ok: false, error: 'تعذر إتمام الطلب. حاول مرة أخرى.' };
  }

  revalidatePath('/orders');
  revalidatePath('/wallet');
  revalidatePath('/account');
  return { ok: true, message: 'تم استلام طلبك بنجاح. يمكنك متابعته من صفحة الطلبات.' };
}

// Creates a PENDING deposit request. The balance is NOT changed here.
// An admin must verify the transfer and approve it through review_deposit().
export async function createDepositAction(input: {
  amountCents: number;
  method: string;
  payerReference: string;
  proofPath: string;
}): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return { ok: false, error: 'يجب تسجيل الدخول أولًا.' };

  const amount = Number(input.amountCents);
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_DEPOSIT_CENTS) {
    return { ok: false, error: 'مبلغ الإيداع غير صالح.' };
  }
  if (!(DEPOSIT_METHODS as readonly string[]).includes(input.method)) {
    return { ok: false, error: 'طريقة الدفع غير صالحة.' };
  }
  const payer = (input.payerReference ?? '').trim();
  if (payer.length > 64) return { ok: false, error: 'مرجع الدفع طويل جدًا.' };
  if (input.method === 'vodafone_cash' && payer.length < 4) {
    return { ok: false, error: 'أدخل رقم العملية أو رقم المرسل من فودافون كاش.' };
  }
  // Proof must live in the user's own folder in the private bucket.
  const proof = input.proofPath ?? '';
  if (!proof.startsWith(`${ctx.userId}/`) || proof.includes('..') || proof.length > 200) {
    return { ok: false, error: 'إثبات الدفع غير صالح. أعد رفع الصورة.' };
  }

  const { error } = await ctx.supabase.from('deposits').insert({
    user_id: ctx.userId,
    amount_cents: amount,
    method: input.method,
    payer_reference: payer || null,
    proof_path: proof,
  });
  if (error) return { ok: false, error: 'تعذر إرسال طلب الإيداع. حاول مرة أخرى.' };

  revalidatePath('/wallet');
  return { ok: true, message: 'تم إرسال طلب الإيداع. سيُضاف الرصيد بعد مراجعة التحويل.' };
}
