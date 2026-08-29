-- 0003_feedback.sql

do $$ begin
  create type feedback_category as enum ('bug','feature','ux','other');
exception when duplicate_object then null; end $$;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category feedback_category not null default 'other',
  message text not null check (char_length(message) > 0 and char_length(message) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_user on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback_select_own" on public.feedback;
create policy "feedback_select_own" on public.feedback for select using (auth.uid() = user_id);

drop policy if exists "feedback_insert_own" on public.feedback;
create policy "feedback_insert_own" on public.feedback for insert with check (auth.uid() = user_id);

-- No update/delete policy: feedback is append-only from the client.

grant select, insert on public.feedback to authenticated;
