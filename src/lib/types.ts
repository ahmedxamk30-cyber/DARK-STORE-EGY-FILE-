export type Role = 'user' | 'support' | 'admin' | 'super_admin';

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  balance_cents: number;
  created_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  kind: 'game' | 'social' | 'gift';
  image_url: string | null;
  sort_order: number;
  is_visible: boolean;
};

export type Product = {
  id: string;
  category_id: string | null;
  name_ar: string;
  description_ar: string | null;
  image_url: string | null;
  price_cents: number;
  old_price_cents: number | null;
  is_offer: boolean;
  is_active: boolean;
  sort_order: number;
};

export type HomeSection = {
  id: string;
  kind: 'hero' | 'categories' | 'offers' | 'products' | 'text' | 'image';
  title_ar: string | null;
  content: Record<string, string | undefined>;
  sort_order: number;
  is_visible: boolean;
};

export type Order = {
  id: string;
  product_name_ar: string;
  price_cents: number;
  player_reference: string | null;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  amount_cents: number;
  proof_path: string;
  method: 'vodafone_cash' | 'bank_transfer' | 'manual';
  payer_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
};

export type WalletTransaction = {
  id: string;
  amount_cents: number;
  reason: string;
  created_at: string;
};

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
