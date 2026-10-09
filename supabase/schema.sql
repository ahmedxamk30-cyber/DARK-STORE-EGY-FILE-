-- =====================================================================
-- DARK STORE: complete database schema (Supabase / PostgreSQL)
-- For a NEW Supabase project, run this file first, then migrations 0002 and 0003.
-- Do not run against a populated/older database without reviewing schema differences.
-- Every statement uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS so the file can be re-run.
-- =====================================================================

-- ---------- Enums ----------
do $$ begin
  create type public.app_role as enum ('user', 'support', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deposit_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'processing', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
-- Profile row per auth user. Created by trigger below. Balance is in cents.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'user',
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  kind text not null default 'game' check (kind in ('game', 'social', 'gift')),
  image_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete cascade,
  name_ar text not null,
  description_ar text,
  image_url text,
  price_cents bigint not null check (price_cents >= 0),
  old_price_cents bigint check (old_price_cents is null or old_price_cents >= 0),
  is_offer boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('hero', 'categories', 'offers', 'products', 'text', 'image')),
  title_ar text,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

-- Orders keep a snapshot of name and price, so history survives product edits or deletion.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_ar text not null,
  price_cents bigint not null check (price_cents >= 0),
  player_reference text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Deposit requests. The balance changes only when review_deposit() approves one.
create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  proof_path text not null,
  method text not null default 'manual'
    check (method in ('vodafone_cash', 'bank_transfer', 'manual')),
  payer_reference text,
  status public.deposit_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- DB-level ceiling for deposit requests (100000000 cents = 1,000,000 EGP).
-- NOT VALID permits a safe rollout on databases with historical rows, while still
-- enforcing the rule for every new or updated row.
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'deposits_amount_cents_limit'
      and conrelid = 'public.deposits'::regclass
  ) then
    alter table public.deposits
      add constraint deposits_amount_cents_limit
      check (amount_cents <= 100000000) not valid;
  end if;
end $$;

-- Audit ledger for every balance change. Written only by SECURITY DEFINER functions.
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents bigint not null,
  reason text not null,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Editable settings: 'payment_instructions' and 'contact'. Readable by everyone, writable by admins.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Helper functions (used by RLS policies) ----------
create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('support', 'admin', 'super_admin'), false);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

-- Creates the profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.home_sections enable row level security;
alter table public.orders enable row level security;
alter table public.deposits enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.site_settings enable row level security;

-- Profiles: a user reads their own row; staff read all rows.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());

-- Users may update their own row. Column grants below limit this to full_name.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Catalog: visitors see visible items; admins see and manage everything.
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select
  using (is_visible or public.is_admin());
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_read on public.products;
create policy products_read on public.products for select
  using (is_active or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sections_read on public.home_sections;
create policy sections_read on public.home_sections for select
  using (is_visible or public.is_admin());
drop policy if exists sections_admin_write on public.home_sections;
create policy sections_admin_write on public.home_sections for all
  using (public.is_admin()) with check (public.is_admin());

-- Orders: users read their own; staff read all. Orders are created only by place_order().
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders for update
  using (public.is_admin()) with check (public.is_admin());

-- Deposits: users read their own and create pending requests; staff read all.
-- Approval happens only through review_deposit().
drop policy if exists deposits_select on public.deposits;
create policy deposits_select on public.deposits for select
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists deposits_insert_own on public.deposits;
create policy deposits_insert_own on public.deposits for insert
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and amount_cents between 1 and 100000000
    and proof_path like (auth.uid()::text || '/%')
    and position('..' in proof_path) = 0
  );

-- Wallet ledger: users read their own; staff read all. No client writes.
drop policy if exists wallet_select on public.wallet_transactions;
create policy wallet_select on public.wallet_transactions for select
  using (user_id = auth.uid() or public.is_staff());

-- Settings: public read, admin write.
drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings for select
  using (true);
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Table and column privileges (defense in depth) ----------
-- Supabase grants broad privileges on new public tables by default.
-- Revoke everything, then grant only what the app needs. RLS still applies on top.
revoke all on all tables in schema public from anon, authenticated;

grant select on public.categories, public.products, public.home_sections, public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.home_sections, public.site_settings to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;

grant select, insert on public.deposits to authenticated;
grant select on public.wallet_transactions to authenticated;

-- Helper functions must be callable by RLS evaluation.
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------- Business logic (server-side, atomic) ----------
-- Buy an active product with the caller's balance. The price comes from the products table,
-- never from the client. The buyer's profile row is locked so concurrent orders cannot overspend.
create or replace function public.place_order(p_product_id uuid, p_player_reference text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_product public.products%rowtype;
  v_balance bigint;
  v_order_id uuid;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_player_reference is null
     or char_length(btrim(p_player_reference)) < 2
     or char_length(btrim(p_player_reference)) > 64 then
    raise exception 'invalid player reference';
  end if;

  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then raise exception 'product not available'; end if;

  select balance_cents into v_balance from public.profiles where id = v_user for update;
  if v_balance is null then raise exception 'profile not found'; end if;
  if v_balance < v_product.price_cents then raise exception 'insufficient balance'; end if;

  update public.profiles set balance_cents = balance_cents - v_product.price_cents where id = v_user;

  insert into public.orders (user_id, product_id, product_name_ar, price_cents, player_reference)
  values (v_user, v_product.id, v_product.name_ar, v_product.price_cents, btrim(p_player_reference))
  returning id into v_order_id;

  insert into public.wallet_transactions (user_id, amount_cents, reason, actor_id)
  values (v_user, -v_product.price_cents, 'order:' || v_order_id, v_user);

  return v_order_id;
end $$;

-- Approve or reject a pending deposit. Only admins. Approval credits the balance once.
create or replace function public.review_deposit(p_deposit_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_deposit public.deposits%rowtype;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;

  select * into v_deposit from public.deposits where id = p_deposit_id for update;
  if not found then raise exception 'deposit not found'; end if;
  if v_deposit.status <> 'pending' then raise exception 'deposit already reviewed'; end if;

  update public.deposits
     set status = case when p_approve then 'approved'::public.deposit_status
                       else 'rejected'::public.deposit_status end,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_deposit_id;

  if p_approve then
    update public.profiles set balance_cents = balance_cents + v_deposit.amount_cents
     where id = v_deposit.user_id;
    insert into public.wallet_transactions (user_id, amount_cents, reason, actor_id)
    values (v_deposit.user_id, v_deposit.amount_cents, 'deposit:' || p_deposit_id, auth.uid());
  end if;
end $$;

-- Manual balance change by an admin. Always recorded in the ledger with a reason.
-- A negative result is blocked by the balance_cents check constraint.
create or replace function public.adjust_balance(p_user uuid, p_delta bigint, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if p_delta = 0 then raise exception 'delta must not be zero'; end if;

  update public.profiles set balance_cents = balance_cents + p_delta where id = p_user;
  if not found then raise exception 'user not found'; end if;

  insert into public.wallet_transactions (user_id, amount_cents, reason, actor_id)
  values (p_user, p_delta, 'manual:' || p_reason, auth.uid());
end $$;

-- Change a user's role. Only the owner (super_admin).
create or replace function public.set_user_role(p_user uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'not authorized'; end if;
  if p_user = auth.uid() then raise exception 'cannot change own role'; end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'user not found'; end if;
end $$;

-- Only signed-in users may call the business functions.
revoke all on function public.place_order(uuid, text) from public, anon;
revoke all on function public.review_deposit(uuid, boolean) from public, anon;
revoke all on function public.adjust_balance(uuid, bigint, text) from public, anon;
revoke all on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
grant execute on function public.review_deposit(uuid, boolean) to authenticated;
grant execute on function public.adjust_balance(uuid, bigint, text) to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;

-- ---------- Storage ----------
-- deposit-proofs: private. Each user writes only into the folder named after their user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-proofs', 'deposit-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- site-assets: public read. Only admins write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists proofs_insert_own on storage.objects;
create policy proofs_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'deposit-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists proofs_read_own_or_staff on storage.objects;
create policy proofs_read_own_or_staff on storage.objects for select to authenticated
  using (bucket_id = 'deposit-proofs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

drop policy if exists site_assets_read on storage.objects;
create policy site_assets_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists site_assets_admin_write on storage.objects;
create policy site_assets_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());
