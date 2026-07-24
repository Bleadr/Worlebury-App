-- ============================================================================
-- 0004_resources.sql — Resource/asset/file management for staff
-- ============================================================================

do $$ begin
  create type public.resource_kind as enum ('file', 'physical_asset', 'link', 'credential_note');
exception when duplicate_object then null; end $$;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  kind public.resource_kind not null default 'file',
  title text not null,
  description text,
  storage_path text,          -- path within the 'resources' Supabase Storage bucket
  external_url text,          -- for kind = 'link'
  category text,               -- e.g. 'Onboarding', 'Brand Assets', 'IT Equipment'
  serial_number text,          -- for physical_asset
  assigned_to uuid references auth.users(id),  -- who currently has this asset/file
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_assignments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  returned_at timestamptz
);

create index if not exists idx_resources_entity on public.resources(entity_id, category);
