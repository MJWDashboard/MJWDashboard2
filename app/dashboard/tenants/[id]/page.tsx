import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { TenantFormButton } from "../TenantForm";
import { TenantProfileTabs } from "./TenantProfileTabs";

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, buildings(id, name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!tenant) notFound();

  const [
    leasesRes,
    arrearsCurrentRes,
    arrearsHistoryRes,
    arrearsCommentsRes,
    turnoversRes,
    annualCertificatesRes,
    tenantContactsRes,
    availableContactsRes,
    meetingNotesRes,
    actionsRes,
    documentsRes,
    tenantNotesRes,
    buildingsRes,
    emailRows,
  ] = await Promise.all([
    supabase
      .from("leases")
      .select("id, lease_start, lease_end, base_rental, escalation_pct, status, option_period")
      .eq("tenant_id", params.id)
      .order("lease_start", { ascending: false }),
    supabase
      .from("arrears_current")
      .select("current_balance, days_30, days_60, days_90_plus")
      .eq("tenant_id", params.id)
      .maybeSingle(),
    supabase
      .from("arrears_history")
      .select("as_of_month, balance")
      .eq("tenant_id", params.id)
      .order("as_of_month", { ascending: false })
      .limit(12),
    supabase
      .from("arrears_comments")
      .select("id, comment, created_at")
      .eq("tenant_id", params.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("turnovers")
      .select("id, period, turnover_amount, due_date, status")
      .eq("tenant_id", params.id)
      .order("period", { ascending: false })
      .limit(24),
    supabase
      .from("turnover_annual_certificates")
      .select("id, financial_year, due_date, received_at, status")
      .eq("tenant_id", params.id)
      .order("financial_year", { ascending: false }),
    supabase
      .from("tenant_contacts")
      .select("id, role, contacts(name, email, phone)")
      .eq("tenant_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, name, type").is("archived_at", null).order("name"),
    supabase
      .from("meeting_notes")
      .select("id, note, meeting_id, created_at, meetings(title)")
      .eq("tenant_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("action_items")
      .select("id, title, status")
      .eq("tenant_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, file_name, file_path")
      .eq("tenant_id", params.id)
      .is("archived_at", null)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("tenant_notes")
      .select("id, note, created_at, created_by")
      .eq("tenant_id", params.id)
      .order("created_at", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.rpc("org_member_emails"),
  ]);

  const emailByUserId = new Map((emailRows.data ?? []).map((r: any) => [r.user_id, r.email]));

  return (
    <div>
      <PageHeader
        title={tenant.trading_name}
        description={<>{tenant.buildings?.name}{tenant.shop_number ? ` · Shop ${tenant.shop_number}` : ""}</>}
        action={
          <TenantFormButton tenant={tenant as any} label="Edit Tenant" buildings={buildingsRes.data ?? []} />
        }
      />

      <TenantProfileTabs
        tenant={tenant}
        leases={leasesRes.data ?? []}
        arrearsCurrent={arrearsCurrentRes.data}
        arrearsHistory={arrearsHistoryRes.data ?? []}
        arrearsComments={arrearsCommentsRes.data ?? []}
        turnovers={turnoversRes.data ?? []}
        annualCertificates={annualCertificatesRes.data ?? []}
        tenantContacts={tenantContactsRes.data ?? []}
        availableContacts={availableContactsRes.data ?? []}
        meetingNotes={meetingNotesRes.data ?? []}
        actions={actionsRes.data ?? []}
        documents={documentsRes.data ?? []}
        tenantNotes={tenantNotesRes.data ?? []}
        emailByUserId={emailByUserId}
      />
    </div>
  );
}
