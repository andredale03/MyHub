-- ============================================================================
-- MyHub — Schema Supabase
-- Eseguire nel SQL Editor di Supabase (una volta sola).
-- Modello: abbonamento unico "tutto incluso" (stile Setapp).
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
-- Una riga per utente, collegata a auth.users. Conserva lo stato abbonamento
-- mirrorato da Stripe (aggiornato dal webhook nella milestone Pagamenti).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  subscription_status text,                       -- 'active' | 'trialing' | 'canceled' | null
  subscription_current_period_end timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Ogni utente vede e modifica solo il proprio profilo.
drop policy if exists "profili: lettura propria" on public.profiles;
create policy "profili: lettura propria"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profili: aggiornamento proprio" on public.profiles;
create policy "profili: aggiornamento proprio"
  on public.profiles for update
  using (auth.uid() = id);

-- ── creazione automatica del profilo alla registrazione ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── apps (catalogo) ─────────────────────────────────────────────────────────
-- Catalogo condiviso delle app dell'hub. Lettura pubblica; scrittura riservata
-- (gestita dall'admin via service role o policy dedicate in futuro).
create table if not exists public.apps (
  id text primary key,                 -- es. 'paystats'
  name text not null,
  description text,
  route text,                          -- route interna alla shell, es. '/app/paystats'
  url text,                            -- url esterno (fallback se route è null)
  icon text,
  color text,
  status text not null default 'live', -- 'live' | 'wip' | 'planned'
  sort_order int not null default 0
);

alter table public.apps enable row level security;

drop policy if exists "apps: lettura pubblica" on public.apps;
create policy "apps: lettura pubblica"
  on public.apps for select
  using (true);

-- ── entitlements (accesso granulare, opzionale) ─────────────────────────────
-- Nel modello "tutto incluso" l'accesso deriva da profiles.subscription_status.
-- Questa tabella resta pronta per un futuro modello a pacchetti/app singole.
create table if not exists public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  app_id text not null references public.apps (id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlements: lettura propria" on public.entitlements;
create policy "entitlements: lettura propria"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- ── seed del catalogo ────────────────────────────────────────────────────────
insert into public.apps (id, name, description, route, icon, color, status, sort_order)
values (
  'paystats',
  'PayStats',
  'Traccia le tue spese mensili, analizza budget per categoria e visualizza trend finanziari.',
  '/app/paystats',
  '💰',
  'from-indigo-500 to-purple-600',
  'live',
  0
)
on conflict (id) do nothing;
