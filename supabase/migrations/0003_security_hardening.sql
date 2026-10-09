-- Security hardening for the Phase 2 store.
-- Run after 0002_phase2.sql. Safe to re-run.

-- Enforce a 1,000,000 EGP maximum deposit in the database, not just in the UI.
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

-- A user can only create pending requests that use their own private storage folder.
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

-- Apply server-side storage upload restrictions even if a browser calls Storage directly.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deposit-proofs', 'deposit-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Validate player references within the trusted DB function, not only in the server action.
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

-- Prevent even a direct RPC call from accidentally demoting the current owner.
create or replace function public.set_user_role(p_user uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'not authorized'; end if;
  if p_user = auth.uid() then raise exception 'cannot change own role'; end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'user not found'; end if;
end $$;

-- Preserve least-privilege execution grants from schema.sql.
revoke all on function public.place_order(uuid, text) from public, anon;
revoke all on function public.set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.place_order(uuid, text) to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
