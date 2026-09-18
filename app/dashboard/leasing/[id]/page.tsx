import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/StatusBadge";
import { LEASING_STAGE_CLASSES, enumLabel } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";
import { LeasingDealFormButton } from "../LeasingDealForm";
import { FeedbackLog } from "./FeedbackLog";
import { DocumentChecklist } from "./DocumentChecklist";
import { DealsheetButton } from "./DealsheetButton";
import { DealDocuments } from "./DealDocuments";

export default async function LeasingDealDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: deal } = await supabase
    .from("leasing_deals")
    .select("*, buildings(id, name, address), tenants(trading_name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!deal) notFound();

  const [
    { data: feedback },
    { data: docItems },
    { data: templates },
    { data: documents },
    { data: buildings },
    { data: tenants },
    { data: vacantUnits },
  ] = await Promise.all([
    supabase
      .from("leasing_deal_feedback")
      .select("id, comment, created_at")
      .eq("deal_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("leasing_deal_documents")
      .select("id, document_name, received")
      .eq("deal_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("leasing_document_templates").select("id, name").is("archived_at", null).order("name"),
    supabase
      .from("documents")
      .select("id, file_name, file_path, category")
      .eq("leasing_deal_id", params.id)
      .is("archived_at", null),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
    supabase
      .from("vacant_units")
      .select("id, building_id, shop_number")
      .is("archived_at", null),
  ]);

  return (
    <div>
      <PageHeader
        title={deal.tenants?.trading_name ?? deal.prospect_name ?? "Leasing Deal"}
        description={
          <>
            {deal.buildings?.name}
            {deal.shop_number ? ` · Shop ${deal.shop_number}` : ""}
            {deal.enquiry_date ? ` · Enquiry ${formatDate(deal.enquiry_date)}` : ""}
          </>
        }
        action={
          <div className="flex items-center gap-3">
            <Badge label={enumLabel(deal.stage)} className={LEASING_STAGE_CLASSES[deal.stage] ?? ""} />
            <DealsheetButton deal={deal as any} />
            <LeasingDealFormButton
              deal={deal}
              label="Edit"
              buildings={buildings ?? []}
              tenants={tenants ?? []}
              vacantUnits={vacantUnits ?? []}
            />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Deal Value</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(deal.deal_value)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Unit Size</p>
          <p className="mt-1 text-lg font-semibold">{deal.unit_size_sqm ? `${deal.unit_size_sqm} m²` : "—"}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Rate / m²</p>
          <p className="mt-1 text-lg font-semibold">{deal.rate_per_sqm ? formatCurrency(deal.rate_per_sqm) : "—"}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Term</p>
          <p className="mt-1 text-lg font-semibold">
            {deal.lease_term_months ? `${deal.lease_term_months} mo` : "—"}
          </p>
        </div>
      </div>

      {(deal.requirements || deal.contact_email || deal.contact_phone) && (
        <div className="card mb-6">
          <h2 className="mb-2 text-sm font-semibold">Enquiry Details</h2>
          {(deal.contact_email || deal.contact_phone) && (
            <p className="mb-2 text-sm text-charcoal-300">
              Contact: {[deal.contact_email, deal.contact_phone].filter(Boolean).join(" · ")}
            </p>
          )}
          {deal.enquiry_source && (
            <p className="mb-2 text-sm text-charcoal-300">Source: {deal.enquiry_source}</p>
          )}
          {deal.requirements && <p className="whitespace-pre-wrap text-sm text-charcoal-300">{deal.requirements}</p>}
        </div>
      )}

      {deal.notes && (
        <div className="card mb-6">
          <h2 className="mb-2 text-sm font-semibold">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-charcoal-300">{deal.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FeedbackLog dealId={deal.id} feedback={feedback ?? []} />
        <DocumentChecklist dealId={deal.id} items={docItems ?? []} templates={templates ?? []} />
        <DealDocuments dealId={deal.id} buildingId={deal.building_id} documents={documents ?? []} />
      </div>
    </div>
  );
}
