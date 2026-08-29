-- 0002_bets.sql
-- bets + bet_legs tables, enums, constraints, indexes, triggers, RLS.

do $$ begin
  create type bet_type as enum ('single','sgp','parlay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bet_result as enum ('pending','won','lost','push','void');
exception when duplicate_object then null; end $$;

do $$ begin
  create type when_placed_t as enum ('pregame','live_1h','halftime','live_2h','live');
exception when duplicate_object then null; end $$;

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bet_type bet_type not null,
  placed_at timestamptz not null default now(),
  when_placed when_placed_t not null default 'pregame',
  sport text not null,
  league text not null,
  match text not null,
  odds numeric(8,3) not null check (odds > 1),
  sportsbook text not null,
  wager numeric(12,2) not null check (wager > 0),
  result bet_result not null default 'pending',
  actual_return numeric(14,2),
  profit numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_has_no_settlement check (
    result <> 'pending' or (actual_return is null and profit is null)
  )
);

create table if not exists public.bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  leg_order integer not null check (leg_order >= 1 and leg_order <= 6),
  sport text not null,
  league text not null,
  match text not null,
  prop_type text not null,
  prop text not null,
  leg_odds numeric(8,3) check (leg_odds is null or leg_odds > 1),
  result bet_result not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bet_id, leg_order)
);

-- updated_at triggers
drop trigger if exists trg_bets_updated_at on public.bets;
create trigger trg_bets_updated_at
  before update on public.bets
  for each row execute function public.set_updated_at();

drop trigger if exists trg_bet_legs_updated_at on public.bet_legs;
create trigger trg_bet_legs_updated_at
  before update on public.bet_legs
  for each row execute function public.set_updated_at();

-- Keep bet_legs.user_id in sync with parent bet's user_id (defense in depth for RLS).
create or replace function public.sync_leg_user_id()
returns trigger as $$
declare
  owner uuid;
begin
  select user_id into owner from public.bets where id = new.bet_id;
  if owner is null then
    raise exception 'Parent bet % not found', new.bet_id;
  end if;
  new.user_id = owner;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_bet_legs_sync_owner on public.bet_legs;
create trigger trg_bet_legs_sync_owner
  before insert or update on public.bet_legs
  for each row execute function public.sync_leg_user_id();

-- Indexes supporting the common dashboard / My Bets queries.
create index if not exists idx_bets_user_placed on public.bets (user_id, placed_at desc);
create index if not exists idx_bets_user_result on public.bets (user_id, result);
create index if not exists idx_bets_user_sportsbook on public.bets (user_id, sportsbook);
create index if not exists idx_bets_user_sport on public.bets (user_id, sport);
create index if not exists idx_bets_user_league on public.bets (user_id, league);
create index if not exists idx_bets_user_bet_type on public.bets (user_id, bet_type);
create index if not exists idx_bet_legs_bet_order on public.bet_legs (bet_id, leg_order);
create index if not exists idx_bet_legs_user on public.bet_legs (user_id);

-- RLS
alter table public.bets enable row level security;
alter table public.bet_legs enable row level security;

drop policy if exists "bets_select_own" on public.bets;
create policy "bets_select_own" on public.bets for select using (auth.uid() = user_id);

drop policy if exists "bets_insert_own" on public.bets;
create policy "bets_insert_own" on public.bets for insert with check (auth.uid() = user_id);

drop policy if exists "bets_update_own" on public.bets;
create policy "bets_update_own" on public.bets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bets_delete_own" on public.bets;
create policy "bets_delete_own" on public.bets for delete using (auth.uid() = user_id);

drop policy if exists "bet_legs_select_own" on public.bet_legs;
create policy "bet_legs_select_own" on public.bet_legs for select using (auth.uid() = user_id);

-- Inserts/updates on legs are only valid when the parent bet is owned by the caller.
drop policy if exists "bet_legs_insert_own" on public.bet_legs;
create policy "bet_legs_insert_own" on public.bet_legs for insert with check (
  exists (select 1 from public.bets b where b.id = bet_id and b.user_id = auth.uid())
);

drop policy if exists "bet_legs_update_own" on public.bet_legs;
create policy "bet_legs_update_own" on public.bet_legs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bet_legs_delete_own" on public.bet_legs;
create policy "bet_legs_delete_own" on public.bet_legs for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.bets to authenticated;
grant select, insert, update, delete on public.bet_legs to authenticated;
