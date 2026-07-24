-- ============================================================================
-- 0002_crm.sql — CRM / pipeline module
-- ============================================================================

do $$ begin
  create type public.contact_type as enum ('lead', 'contact', 'customer');
exception when duplicate_object then null; end $$;

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  crm_company_id uuid references public.crm_companies(id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  type public.contact_type not null default 'lead',
  source text,                       -- e.g. 'website', 'referral', 'import:2026-07-24.csv'
  owner_id uuid references auth.users(id),  -- salesperson responsible
  tags text[] default '{}',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null default 'Sales Pipeline',
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  name text not null,
  position int not null,
  probability int not null default 0 check (probability between 0 and 100),
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  stage_id uuid not null references public.crm_pipeline_stages(id) on delete restrict,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  crm_company_id uuid references public.crm_companies(id) on delete set null,
  title text not null,
  value_amount numeric(14,2) default 0,
  value_currency text default 'GBP',
  owner_id uuid references auth.users(id),
  expected_close_date date,
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open','won','lost')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  type text not null default 'note' check (type in ('note','call','email','meeting','task')),
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Track bulk imports so users can see history / undo scope
create table if not exists public.crm_imports (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  file_name text,
  row_count int,
  imported_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_contacts_entity on public.crm_contacts(entity_id);
create index if not exists idx_crm_deals_entity_stage on public.crm_deals(entity_id, stage_id);
create index if not exists idx_crm_activities_deal on public.crm_activities(deal_id);
