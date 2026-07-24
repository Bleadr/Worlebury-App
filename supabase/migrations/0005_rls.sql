-- ============================================================================
-- 0005_rls.sql — Row Level Security for every table.
-- Default posture: RLS ON everywhere, no access unless explicitly granted.
-- All checks route through public.can_do() / public.is_entity_member()
-- defined in 0001_core.sql, so permission logic lives in one place.
-- ============================================================================

alter table public.entities enable row level security;
alter table public.profiles enable row level security;
alter table public.entity_members enable row level security;
alter table public.tool_permissions enable row level security;
alter table public.audit_log enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_pipelines enable row level security;
alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_imports enable row level security;
alter table public.finance_invoices enable row level security;
alter table public.finance_invoice_lines enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.resources enable row level security;
alter table public.resource_assignments enable row level security;

-- ---------------------------------------------------------------------------
-- entities: members can see their own entities; only super admins create them
-- ---------------------------------------------------------------------------
create policy "members can view their entities" on public.entities
  for select using (public.is_entity_member(auth.uid(), id));

create policy "super admins manage entities" on public.entities
  for all using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- profiles: users see/update their own profile; entity teammates can view
-- each other's basic profile (needed for "assigned to" dropdowns etc.)
-- ---------------------------------------------------------------------------
create policy "view own profile" on public.profiles
  for select using (id = auth.uid());

create policy "view teammate profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.entity_members em1
      join public.entity_members em2 on em1.entity_id = em2.entity_id
      where em1.user_id = auth.uid() and em2.user_id = public.profiles.id
    )
  );

create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- entity_members: visible to fellow members; only owners/admins/super admins
-- manage membership (this is the access-management surface)
-- ---------------------------------------------------------------------------
create policy "members view membership" on public.entity_members
  for select using (public.is_entity_member(auth.uid(), entity_id));

create policy "admins manage membership" on public.entity_members
  for all using (
    public.is_super_admin(auth.uid())
    or public.entity_role(auth.uid(), entity_id) in ('owner','admin')
  )
  with check (
    public.is_super_admin(auth.uid())
    or public.entity_role(auth.uid(), entity_id) in ('owner','admin')
  );

-- ---------------------------------------------------------------------------
-- tool_permissions: same admin-only management pattern
-- ---------------------------------------------------------------------------
create policy "members view own permissions" on public.tool_permissions
  for select using (
    user_id = auth.uid() or public.is_entity_member(auth.uid(), entity_id)
  );

create policy "admins manage permissions" on public.tool_permissions
  for all using (
    public.is_super_admin(auth.uid())
    or public.entity_role(auth.uid(), entity_id) in ('owner','admin')
  )
  with check (
    public.is_super_admin(auth.uid())
    or public.entity_role(auth.uid(), entity_id) in ('owner','admin')
  );

-- ---------------------------------------------------------------------------
-- audit_log: readable by entity admins, insertable by any member (server-side)
-- ---------------------------------------------------------------------------
create policy "admins view audit log" on public.audit_log
  for select using (
    public.is_super_admin(auth.uid())
    or public.entity_role(auth.uid(), entity_id) in ('owner','admin')
  );

create policy "members write audit log" on public.audit_log
  for insert with check (public.is_entity_member(auth.uid(), entity_id));

-- ---------------------------------------------------------------------------
-- Generic helper macro (documented pattern — Postgres has no real macros,
-- so each table's policy is spelled out, but they all follow this shape):
--
--   SELECT -> can_do(uid, entity_id, '<tool>', 'view')
--   INSERT/UPDATE -> can_do(uid, entity_id, '<tool>', 'edit')
--   DELETE -> can_do(uid, entity_id, '<tool>', 'delete')
-- ---------------------------------------------------------------------------

-- CRM ------------------------------------------------------------------------
create policy "crm_companies select" on public.crm_companies for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_companies insert" on public.crm_companies for insert with check (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_companies update" on public.crm_companies for update using (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_companies delete" on public.crm_companies for delete using (public.can_do(auth.uid(), entity_id, 'crm', 'delete'));

create policy "crm_contacts select" on public.crm_contacts for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_contacts insert" on public.crm_contacts for insert with check (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_contacts update" on public.crm_contacts for update using (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_contacts delete" on public.crm_contacts for delete using (public.can_do(auth.uid(), entity_id, 'crm', 'delete'));

create policy "crm_pipelines select" on public.crm_pipelines for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_pipelines manage" on public.crm_pipelines for all using (public.can_do(auth.uid(), entity_id, 'crm', 'manage')) with check (public.can_do(auth.uid(), entity_id, 'crm', 'manage'));

create policy "crm_pipeline_stages select" on public.crm_pipeline_stages for select using (
  exists (select 1 from public.crm_pipelines p where p.id = pipeline_id and public.can_do(auth.uid(), p.entity_id, 'crm', 'view'))
);
create policy "crm_pipeline_stages manage" on public.crm_pipeline_stages for all using (
  exists (select 1 from public.crm_pipelines p where p.id = pipeline_id and public.can_do(auth.uid(), p.entity_id, 'crm', 'manage'))
) with check (
  exists (select 1 from public.crm_pipelines p where p.id = pipeline_id and public.can_do(auth.uid(), p.entity_id, 'crm', 'manage'))
);

create policy "crm_deals select" on public.crm_deals for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_deals insert" on public.crm_deals for insert with check (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_deals update" on public.crm_deals for update using (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_deals delete" on public.crm_deals for delete using (public.can_do(auth.uid(), entity_id, 'crm', 'delete'));

create policy "crm_activities select" on public.crm_activities for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_activities insert" on public.crm_activities for insert with check (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_activities update" on public.crm_activities for update using (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));
create policy "crm_activities delete" on public.crm_activities for delete using (public.can_do(auth.uid(), entity_id, 'crm', 'delete'));

create policy "crm_imports select" on public.crm_imports for select using (public.can_do(auth.uid(), entity_id, 'crm', 'view'));
create policy "crm_imports insert" on public.crm_imports for insert with check (public.can_do(auth.uid(), entity_id, 'crm', 'edit'));

-- Finance ---------------------------------------------------------------------
create policy "finance_invoices select" on public.finance_invoices for select using (public.can_do(auth.uid(), entity_id, 'finance', 'view'));
create policy "finance_invoices insert" on public.finance_invoices for insert with check (public.can_do(auth.uid(), entity_id, 'finance', 'edit'));
create policy "finance_invoices update" on public.finance_invoices for update using (public.can_do(auth.uid(), entity_id, 'finance', 'edit'));
create policy "finance_invoices delete" on public.finance_invoices for delete using (public.can_do(auth.uid(), entity_id, 'finance', 'delete'));

create policy "finance_invoice_lines select" on public.finance_invoice_lines for select using (
  exists (select 1 from public.finance_invoices i where i.id = invoice_id and public.can_do(auth.uid(), i.entity_id, 'finance', 'view'))
);
create policy "finance_invoice_lines manage" on public.finance_invoice_lines for all using (
  exists (select 1 from public.finance_invoices i where i.id = invoice_id and public.can_do(auth.uid(), i.entity_id, 'finance', 'edit'))
) with check (
  exists (select 1 from public.finance_invoices i where i.id = invoice_id and public.can_do(auth.uid(), i.entity_id, 'finance', 'edit'))
);

create policy "finance_expenses select" on public.finance_expenses for select using (public.can_do(auth.uid(), entity_id, 'finance', 'view'));
create policy "finance_expenses insert" on public.finance_expenses for insert with check (public.can_do(auth.uid(), entity_id, 'finance', 'edit'));
create policy "finance_expenses update" on public.finance_expenses for update using (public.can_do(auth.uid(), entity_id, 'finance', 'edit'));
create policy "finance_expenses delete" on public.finance_expenses for delete using (public.can_do(auth.uid(), entity_id, 'finance', 'delete'));

-- Resources ---------------------------------------------------------------------
create policy "resources select" on public.resources for select using (public.can_do(auth.uid(), entity_id, 'resources', 'view'));
create policy "resources insert" on public.resources for insert with check (public.can_do(auth.uid(), entity_id, 'resources', 'edit'));
create policy "resources update" on public.resources for update using (public.can_do(auth.uid(), entity_id, 'resources', 'edit'));
create policy "resources delete" on public.resources for delete using (public.can_do(auth.uid(), entity_id, 'resources', 'delete'));

create policy "resource_assignments select" on public.resource_assignments for select using (
  user_id = auth.uid() or exists (select 1 from public.resources r where r.id = resource_id and public.can_do(auth.uid(), r.entity_id, 'resources', 'view'))
);
create policy "resource_assignments manage" on public.resource_assignments for all using (
  exists (select 1 from public.resources r where r.id = resource_id and public.can_do(auth.uid(), r.entity_id, 'resources', 'edit'))
) with check (
  exists (select 1 from public.resources r where r.id = resource_id and public.can_do(auth.uid(), r.entity_id, 'resources', 'edit'))
);
