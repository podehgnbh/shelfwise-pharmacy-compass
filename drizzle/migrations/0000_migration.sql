create type public.app_role as enum ('admin', 'pharmacy');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  pharmacy_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  code text not null,
  name text not null default '',
  created_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  name text,
  scientific_name text,
  company text,
  shelf_id uuid references public.shelves(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  expiry_date date,
  quantity integer,
  notes text,
  created_at timestamptz not null default now(),
  constraint name_or_scientific check (coalesce(nullif(trim(name),''), nullif(trim(scientific_name),'')) is not null)
);

grant select, insert, update, delete on public.shelves, public.categories, public.medicines to authenticated;
grant all on public.shelves, public.categories, public.medicines to service_role;
alter table public.shelves enable row level security;
alter table public.categories enable row level security;
alter table public.medicines enable row level security;
create policy "own shelves" on public.shelves for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own categories" on public.categories for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own medicines" on public.medicines for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index on public.medicines (owner_id, expiry_date);