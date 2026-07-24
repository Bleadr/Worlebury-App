-- ============================================================================
-- 0003_finance.sql — Invoices, expenses/expenditure
-- ============================================================================

create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  invoice_number text not null,
  crm_company_id uuid references public.crm_companies(id) on delete set null,
  client_name text not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','void')),
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'GBP',
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, invoice_number)
);

create table if not exists public.finance_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.finance_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0,
  position int not null default 0
);

do $$ begin
  create type public.expense_category as enum
    ('travel','software','payroll','marketing','office','professional_services','utilities','other');
exception when duplicate_object then null; end $$;

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  category public.expense_category not null default 'other',
  description text not null,
  amount numeric(14,2) not null,
  currency text not null default 'GBP',
  expense_date date not null default current_date,
  vendor text,
  receipt_url text,               -- points to a file in the 'resources' storage bucket
  status text not null default 'pending' check (status in ('pending','approved','reimbursed','rejected')),
  submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_entity on public.finance_invoices(entity_id, status);
create index if not exists idx_expenses_entity on public.finance_expenses(entity_id, expense_date desc);
