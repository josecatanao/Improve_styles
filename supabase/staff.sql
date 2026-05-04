create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null default 'viewer',
  permissions text[] not null default '{}',
  status text not null default 'invited',
  notes text,
  invited_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.staff_members add column if not exists owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade;
alter table public.staff_members add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table public.staff_members add column if not exists full_name text not null default '';
alter table public.staff_members add column if not exists email text not null default '';
alter table public.staff_members add column if not exists role text not null default 'viewer';
alter table public.staff_members add column if not exists permissions text[] not null default '{}';
alter table public.staff_members add column if not exists status text not null default 'invited';
alter table public.staff_members add column if not exists notes text;
alter table public.staff_members add column if not exists invited_at timestamptz;
alter table public.staff_members add column if not exists last_login_at timestamptz;
alter table public.staff_members add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.staff_members add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.staff_members
  drop constraint if exists staff_members_role_check;

alter table public.staff_members
  add constraint staff_members_role_check
  check (role in ('admin', 'manager', 'editor', 'viewer'));

alter table public.staff_members
  drop constraint if exists staff_members_status_check;

alter table public.staff_members
  add constraint staff_members_status_check
  check (status in ('invited', 'active', 'inactive'));

create unique index if not exists staff_members_owner_email_key
  on public.staff_members(owner_id, lower(email));

create unique index if not exists staff_members_auth_user_id_key
  on public.staff_members(auth_user_id)
  where auth_user_id is not null;

create index if not exists staff_members_owner_created_at_idx
  on public.staff_members(owner_id, created_at desc);

create index if not exists staff_members_owner_status_idx
  on public.staff_members(owner_id, status);

drop trigger if exists staff_members_set_updated_at on public.staff_members;
create trigger staff_members_set_updated_at
before update on public.staff_members
for each row
execute function public.set_updated_at();

alter table public.staff_members enable row level security;

drop policy if exists "staff_members_select_own" on public.staff_members;
create policy "staff_members_select_own"
on public.staff_members
for select
using (owner_id = auth.uid());

drop policy if exists "staff_members_select_self" on public.staff_members;
create policy "staff_members_select_self"
on public.staff_members
for select
using (auth_user_id = auth.uid());

drop policy if exists "staff_members_insert_own" on public.staff_members;
create policy "staff_members_insert_own"
on public.staff_members
for insert
with check (owner_id = auth.uid());
drop policy if exists "staff_members_update_own" on public.staff_members;
create policy "staff_members_update_own"
on public.staff_members
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "staff_members_delete_own" on public.staff_members;
create policy "staff_members_delete_own"
on public.staff_members
for delete
using (owner_id = auth.uid());
