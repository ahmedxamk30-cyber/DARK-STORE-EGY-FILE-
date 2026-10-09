'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrderStatusAction } from '@/app/dark-control/actions';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import type { Order } from '@/lib/types';

export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: Order['status'] }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  async function change(next: Order['status']) {
    setBusy(true);
    const res = await updateOrderStatusAction(orderId, next);
    setBusy(false);
    if (res.ok) {
      setValue(next);
      router.refresh();
    } else {
      window.alert(res.error);
    }
  }

  return (
    <select aria-label="حالة الطلب" value={value} disabled={busy}
      onChange={(e) => change(e.target.value as Order['status'])}
      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm disabled:opacity-60">
      {(Object.keys(ORDER_STATUS_LABEL) as Order['status'][]).map((s) => (
        <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
      ))}
    </select>
  );
}
