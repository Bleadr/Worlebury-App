-- v2 update: expense approval guard, invoice extras, to-do/kanban board.
-- Run this once in the Supabase SQL editor against the existing project.
-- Everything here is additive and written to be safe to re-run if it's
-- ever interrupted partway through (existing objects are skipped, not
-- recreated).

-- ---------------------------------------------------------------------
-- 1. Expense approvals: DB-level guard, not just app-level.
-- Anyone with finance 'edit' access can still create/edit expense rows,
-- but only a super admin may change an expense's status (approve/reject/
-- reimburse). This backstops the server-action checks in
-- src/app/(app)/finance/expenses/actions.ts in case anything ever writes
-- to this table directly.
-- ---------------------------------------------------------------------
create or replace function public.guard_expense_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not public.is_super_admin(auth.uid()) then
      raise exception 'Only a super admin can change an expense status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_expense_status on public.finance_expenses;
create trigger trg_guard_expense_status
  before update on public.finance_expenses
  for each row execute function public.guard_expense_status_change();

-- ---------------------------------------------------------------------
-- 2. Invoices: account linking already exists (finance_invoices.crm_company_id,
-- added in 0003_finance.sql) — this just adds an editable template/branding
-- settings row per entity for the PDF/print view.
-- ---------------------------------------------------------------------
create table if not exists public.invoice_settings (
  entity_id uuid primary key references public.entities(id) on delete cascade,
  company_name text not null default 'Worlebury',
  company_address text,
  company_email text,
  company_phone text,
  logo_url text,
  accent_color text not null default '#B8863B',
  footer_note text not null default 'Thank you for your business.',
  payment_terms text not null default 'Payment due within 30 days.',
  bank_details text,
  next_invoice_number int not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.invoice_settings enable row level security;

drop policy if exists "invoice_settings select" on public.invoice_settings;
create policy "invoice_settings select" on public.invoice_settings
  for select using (public.can_do(auth.uid(), entity_id, 'finance', 'view'));
drop policy if exists "invoice_settings manage" on public.invoice_settings;
create policy "invoice_settings manage" on public.invoice_settings
  for all using (public.can_do(auth.uid(), entity_id, 'finance', 'manage'))
  with check (public.can_do(auth.uid(), entity_id, 'finance', 'manage'));

-- ---------------------------------------------------------------------
-- 3. To-do / Kanban board.
-- ---------------------------------------------------------------------
do $$ begin
  create type public.todo_status as enum ('backlog', 'todo', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

create table if not exists public.todo_boards (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null default 'Team board',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.todo_cards (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  board_id uuid not null references public.todo_boards(id) on delete cascade,
  title text not null,
  description text,
  status public.todo_status not null default 'todo',
  position int not null default 0,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists todo_cards_board_idx on public.todo_cards(board_id, status, position);

alter table public.todo_boards enable row level security;
alter table public.todo_cards enable row level security;

-- To-do is a general team tool — anyone who is a member of the entity can
-- use it (no separate 'todo' permission tool, to keep this lightweight).
drop policy if exists "todo_boards all" on public.todo_boards;
create policy "todo_boards all" on public.todo_boards
  for all using (public.is_entity_member(auth.uid(), entity_id))
  with check (public.is_entity_member(auth.uid(), entity_id));
drop policy if exists "todo_cards all" on public.todo_cards;
create policy "todo_cards all" on public.todo_cards
  for all using (public.is_entity_member(auth.uid(), entity_id))
  with check (public.is_entity_member(auth.uid(), entity_id));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_todo_cards_updated_at on public.todo_cards;
create trigger set_todo_cards_updated_at
  before update on public.todo_cards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. PostgREST embedding fix.
-- Several pages do `.select("...profiles(full_name)")` off tables like
-- entity_members, crm_activities and finance_expenses. Those columns were
-- only ever declared `references auth.users(id)` — PostgREST can't embed
-- public.profiles through that, since auth.users isn't in the exposed API
-- schema, so those queries fail with "Could not find a relationship...".
-- Adding a second FK straight to public.profiles(id) (safe: every
-- auth.users row gets a profiles row via the handle_new_user trigger, so
-- the two constraints can never disagree) gives PostgREST the relationship
-- it needs without touching the original auth.users FK or any RLS policy.
-- ---------------------------------------------------------------------
do $$ begin
  alter table public.entity_members
    add constraint entity_members_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.crm_activities
    add constraint crm_activities_created_by_profiles_fkey foreign key (created_by) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_expenses
    add constraint finance_expenses_submitted_by_profiles_fkey foreign key (submitted_by) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.todo_cards
    add constraint todo_cards_assigned_to_profiles_fkey foreign key (assigned_to) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.audit_log
    add constraint audit_log_actor_id_profiles_fkey foreign key (actor_id) references public.profiles(id) on delete set null;
exception when duplicate_object then null; end $$;
