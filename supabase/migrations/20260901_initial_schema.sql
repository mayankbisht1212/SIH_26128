-- Run this migration in the Supabase SQL editor or with the Supabase CLI.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'Farmer',
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tag_id text not null,
  species text not null,
  health_status text not null default 'healthy' check (health_status in ('healthy', 'sick')),
  last_vaccinated_on date,
  vaccine_name text,
  next_vaccination_on date,
  created_at timestamptz not null default now(),
  unique (owner_id, tag_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  animal_id uuid references public.animals(id) on delete set null,
  species text,
  symptoms_text text,
  selected_symptoms text[] not null default '{}',
  mortality_count integer not null default 0 check (mortality_count >= 0),
  village text,
  block text,
  district text,
  latitude numeric,
  longitude numeric,
  assessment text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.animals enable row level security;
alter table public.reports enable row level security;

create policy "Users manage their own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users manage their own animals" on public.animals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their own reports" on public.reports
  for all using (auth.uid() = reporter_id) with check (auth.uid() = reporter_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'role', 'Farmer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();
