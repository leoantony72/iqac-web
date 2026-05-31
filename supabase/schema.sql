-- Supabase schema for iqac-web
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  department text not null,
  role text not null default 'faculty',
  scrutiny boolean not null default false,
  scrutiny_common boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  subject_code text,
  course_name text,
  description text,
  teacher_name text,
  uploaded_by text not null references public.users(email) on delete cascade,
  status text not null default 'Pending',
  dept text,
  shared text[] not null default '{}',
  year text,
  semester text,
  file_name text,
  file_name_a text,
  file_url_a text,
  file_name_b text,
  file_url_b text,
  file_url text,
  feedback text[] not null default '{}',
  scrutiny_report jsonb,
  approved_at timestamptz,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    name,
    department,
    role,
    photo_url,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'department', 'AD'),
    coalesce(new.raw_user_meta_data ->> 'role', 'faculty'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    now(),
    now()
  )
  on conflict (email) do update set
    name = excluded.name,
    department = excluded.department,
    role = excluded.role,
    photo_url = excluded.photo_url,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.uploads enable row level security;

drop policy if exists "Authenticated users can read users" on public.users;
drop policy if exists "Authenticated users can insert users" on public.users;
drop policy if exists "Authenticated users can update users" on public.users;
drop policy if exists "Authenticated users can delete users" on public.users;
drop policy if exists "Authenticated users can read uploads" on public.uploads;
drop policy if exists "Authenticated users can insert uploads" on public.uploads;
drop policy if exists "Authenticated users can update uploads" on public.uploads;
drop policy if exists "Authenticated users can delete uploads" on public.uploads;

create policy "Authenticated users can read users"
  on public.users
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert users"
  on public.users
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update users"
  on public.users
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete users"
  on public.users
  for delete
  to authenticated
  using (true);

create policy "Authenticated users can read uploads"
  on public.uploads
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert uploads"
  on public.uploads
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update uploads"
  on public.uploads
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete uploads"
  on public.uploads
  for delete
  to authenticated
  using (true);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.users to authenticated;
grant select, insert, update, delete on public.uploads to authenticated;

create index if not exists users_email_idx on public.users (email);
create index if not exists uploads_uploaded_by_idx on public.uploads (uploaded_by);
create index if not exists uploads_status_idx on public.uploads (status);
create index if not exists uploads_dept_idx on public.uploads (dept);
create index if not exists uploads_shared_idx on public.uploads using gin (shared);
