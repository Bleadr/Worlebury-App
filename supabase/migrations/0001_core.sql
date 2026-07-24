-- ============================================================================
-- 0001_core.sql
-- Core multi-tenant model: entities (companies), profiles, memberships,
-- per-tool permissions, and an audit log.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- entities: the different companies/businesses using this platform
-- ---------------------------------------------------------------------------
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

comment on table public.entities is 'Companies/business units tenanted within the app (e.g. Worlebury, and future group companies).';

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, holds display info + platform-level flag
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  -- super_admin can create/deactivate entities and see everything.
  -- This is a small, deliberately-limited group (e.g. group directors).
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- entity_members: which users belong to which entity, and their role
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.entity_role as enum ('owner', 'admin', 'manager', 'member', 'read_only');
exception when duplicate_object then null; end $$;

create table if not exists public.entity_members (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.entity_role not null default 'member',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (entity_id, user_id)
);

-- ---------------------------------------------------------------------------
-- tool_permissions: fine-grained, per-user, per-entity, per-tool permissions.
-- 'owner' and 'admin' roles implicitly get full access (see fn below) —
-- this table is what lets an admin grant a 'member' access to just Finance,
-- or view-only access to CRM, etc.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_tool as enum ('crm', 'finance', 'reporting', 'resources', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists public.tool_permissions (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool public.app_tool not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_manage boolean not null default false, -- manage = configure the tool itself (e.g. pipeline stages)
  granted_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (entity_id, user_id, tool)
);

-- ---------------------------------------------------------------------------
-- audit_log: who did what, where. Cheap insurance + useful for compliance.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  entity_id uuid references public.entities(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,           -- e.g. 'invoice.created', 'permission.updated'
  target_table text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_entity_members_user on public.entity_members(user_id);
create index if not exists idx_entity_members_entity on public.entity_members(entity_id);
create index if not exists idx_tool_permissions_lookup on public.tool_permissions(entity_id, user_id, tool);
create index if not exists idx_audit_log_entity on public.audit_log(entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies across every module.
-- Marked SECURITY DEFINER + STABLE so they can be safely used inside policies
-- without recursive RLS evaluation issues.
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from public.profiles where id = uid), false);
$$;

create or replace function public.is_entity_member(uid uuid, eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.entity_members
    where user_id = uid and entity_id = eid
  ) or public.is_super_admin(uid);
$$;

create or replace function public.entity_role(uid uuid, eid uuid)
returns public.entity_role language sql stable security definer set search_path = public as $$
  select role from public.entity_members where user_id = uid and entity_id = eid limit 1;
$$;

-- can_do(): the single choke point every policy calls through.
-- owner/admin roles get implicit full access; everyone else needs an explicit
-- tool_permissions row.
create or replace function public.can_do(uid uuid, eid uuid, t public.app_tool, action text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  r public.entity_role;
  perm record;
begin
  if public.is_super_admin(uid) then
    return true;
  end if;

  select role into r from public.entity_members where user_id = uid and entity_id = eid;
  if r is null then
    return false;
  end if;
  if r in ('owner', 'admin') then
    return true;
  end if;

  select * into perm from public.tool_permissions
    where user_id = uid and entity_id = eid and tool = t;
  if perm is null then
    return false;
  end if;

  return case action
    when 'view' then perm.can_view
    when 'edit' then perm.can_edit
    when 'delete' then perm.can_delete
    when 'manage' then perm.can_manage
    else false
  end;
end;
$$;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
