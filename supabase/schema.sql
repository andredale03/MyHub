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
  is_admin boolean not null default false,        -- gestisce il catalogo app dall'area /admin
  created_at timestamptz not null default now()
);

-- Per progetti già esistenti: aggiunge la colonna se mancante.
alter table public.profiles add column if not exists is_admin boolean not null default false;

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

-- ── helper: l'utente corrente è admin? ──────────────────────────────────────
-- SECURITY DEFINER per evitare ricorsioni di RLS quando usata nelle policy.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

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

-- Scrittura del catalogo riservata agli admin (gestione da /admin).
drop policy if exists "apps: insert admin" on public.apps;
create policy "apps: insert admin"
  on public.apps for insert
  with check (public.is_admin());

drop policy if exists "apps: update admin" on public.apps;
create policy "apps: update admin"
  on public.apps for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "apps: delete admin" on public.apps;
create policy "apps: delete admin"
  on public.apps for delete
  using (public.is_admin());

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

-- ── PayStats: dati per-utente ────────────────────────────────────────────────
-- Categorie, spese e impostazioni di PayStats, isolate per utente via RLS.
create table if not exists public.paystats_categories (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  color text,
  icon text,
  budget numeric,
  primary key (user_id, id)
);

create table if not exists public.paystats_expenses (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  amount numeric not null,
  description text,
  category_id text,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.paystats_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  income numeric not null default 2500,
  currency text not null default 'EUR'
);

-- Per progetti già esistenti: aggiunge la colonna valuta se mancante.
alter table public.paystats_settings add column if not exists currency text not null default 'EUR';

alter table public.paystats_categories enable row level security;
alter table public.paystats_expenses  enable row level security;
alter table public.paystats_settings   enable row level security;

-- Ogni utente accede solo ai propri dati (select/insert/update/delete).
drop policy if exists "paystats_categories: proprie" on public.paystats_categories;
create policy "paystats_categories: proprie"
  on public.paystats_categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "paystats_expenses: proprie" on public.paystats_expenses;
create policy "paystats_expenses: proprie"
  on public.paystats_expenses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "paystats_settings: proprie" on public.paystats_settings;
create policy "paystats_settings: proprie"
  on public.paystats_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── GyMode: dati per-utente ──────────────────────────────────────────────────
-- Schede (workouts), sessioni e impostazioni di GyMode, isolate per utente.
create table if not exists public.gymode_workouts (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  description text,
  icon text,
  color text,
  days jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.gymode_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date date not null,
  data jsonb not null,
  primary key (user_id, id)
);

create table if not exists public.gymode_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user',   -- 'personal' | 'user'
  unit text not null default 'kg'       -- 'kg' | 'lb'
);

alter table public.gymode_workouts enable row level security;
alter table public.gymode_sessions enable row level security;
alter table public.gymode_settings enable row level security;

drop policy if exists "gymode_workouts: proprie" on public.gymode_workouts;
create policy "gymode_workouts: proprie"
  on public.gymode_workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gymode_sessions: proprie" on public.gymode_sessions;
create policy "gymode_sessions: proprie"
  on public.gymode_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "gymode_settings: proprie" on public.gymode_settings;
create policy "gymode_settings: proprie"
  on public.gymode_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── seed del catalogo ────────────────────────────────────────────────────────
insert into public.apps (id, name, description, route, icon, color, status, sort_order)
values
  (
    'paystats',
    'PayStats',
    'Traccia le tue spese mensili, analizza budget per categoria e visualizza trend finanziari.',
    '/app/paystats',
    '💰',
    'from-indigo-500 to-purple-600',
    'live',
    0
  ),
  (
    'gymode',
    'GyMode',
    'Schede di allenamento: il personal le crea, l''utente le esegue e tiene lo storico.',
    '/app/gymode',
    '🏋️',
    'from-rose-500 to-orange-600',
    'live',
    1
  )
on conflict (id) do nothing;

-- ── bootstrap del primo admin ────────────────────────────────────────────────
-- Dopo esserti registrato dall'app, promuovi il tuo utente ad admin eseguendo
-- (sostituisci l'email) — serve a sbloccare la gestione del catalogo da /admin:
--
--   update public.profiles set is_admin = true
--   where email = 'tua-email@example.com';
