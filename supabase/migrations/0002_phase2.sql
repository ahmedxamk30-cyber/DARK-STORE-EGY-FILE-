-- Phase 2 migration for this project schema. Run after schema.sql on a compatible database.
-- Do not treat this as a migration path from an unrelated/older production schema.

-- Offers: products can be marked as offers with an optional old price.
alter table public.products
  add column if not exists is_offer boolean not null default false,
  add column if not exists old_price_cents bigint
    check (old_price_cents is null or old_price_cents >= 0);

-- Deposits: record which payment method the user used and their payer reference.
alter table public.deposits
  add column if not exists method text not null default 'manual'
    check (method in ('vodafone_cash', 'bank_transfer', 'manual')),
  add column if not exists payer_reference text;

-- Site settings: contact details and payment instructions, editable by admins only.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select
  using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Only admins may change the wallet balance directly, and only through adjust_balance().
-- Make sure profiles.balance_cents cannot be updated by any client role.
revoke update (balance_cents, role) on public.profiles from anon, authenticated;

-- Allow admins to update deposits only through review_deposit(); no direct update policy is added.
