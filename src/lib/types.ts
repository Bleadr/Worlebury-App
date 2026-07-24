// Hand-written types mirroring the Supabase schema (supabase/migrations/*.sql).
// If you prefer generated types, run:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types.ts
// and then re-export the domain aliases below from that generated file instead.

export type EntityRole = "owner" | "admin" | "manager" | "member" | "read_only";
export type AppTool = "crm" | "finance" | "reporting" | "resources" | "admin";

export interface Entity {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
}

export interface EntityMember {
  id: string;
  entity_id: string;
  user_id: string;
  role: EntityRole;
  created_at: string;
}

export interface ToolPermission {
  id: string;
  entity_id: string;
  user_id: string;
  tool: AppTool;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage: boolean;
}

export interface CrmContact {
  id: string;
  entity_id: string;
  crm_company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  type: "lead" | "contact" | "customer";
  source: string | null;
  owner_id: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface CrmDeal {
  id: string;
  entity_id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: string | null;
  title: string;
  value_amount: number;
  value_currency: string;
  owner_id: string | null;
  expected_close_date: string | null;
  status: "open" | "won" | "lost";
  created_at: string;
}

export interface CrmPipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
}

export interface FinanceInvoice {
  id: string;
  entity_id: string;
  invoice_number: string;
  client_name: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export interface FinanceExpense {
  id: string;
  entity_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  vendor: string | null;
  status: "pending" | "approved" | "reimbursed" | "rejected";
}

export interface Resource {
  id: string;
  entity_id: string;
  kind: "file" | "physical_asset" | "link" | "credential_note";
  title: string;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;
  category: string | null;
  assigned_to: string | null;
  is_active: boolean;
  created_at: string;
}

// Minimal placeholder so `createClient<Database>()` type-checks even before
// you generate full Supabase types. Swap for the generated Database type
// whenever convenient — nothing else needs to change.
export type Database = any;
