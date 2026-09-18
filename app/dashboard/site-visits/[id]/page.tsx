import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { RISK_SEVERITY_CLASSES, enumLabel } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { SiteVisitFormButton } from "../SiteVisitForm";
import { InspectionItemFormButton } from "../InspectionItemForm";
import { PhotoGallery } from "../PhotoUpload";
import { SiteVisitReportButton } from "../SiteVisitReportButton";
import { getSignedPhotoUrls } from "../actions";

export default async function SiteVisitDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: visit } = await supabase
    .from("site_visits")
    .select("*, buildings(id, name, address)")
    .eq("id", params.id)
    .maybeSingle();

  if (!visit) notFound();

  const [{ data: items }, { data: buildings }, { data: tenants }, { data: contractors }] = await Promise.all([
    supabase
      .from("site_visit_items")
      .select(
        "id, category, location, tenant_id, description, risk_level, priority, contractor_id, target_date, status, notes, tenants(trading_name), contractors(company_name, contact_name), site_visit_photos(id, file_path, caption)"
      )
      .eq("site_visit_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase
      .from("tenants")
      .select("id, trading_name")
      .eq("building_id", visit.building_id)
      .is("archived_at", null)
      .order("trading_name"),
    supabase
      .from("contractors")
      .select("id, company_name, contact_name, trade")
      .is("archived_at", null),
  ]);

  const allPaths = (items ?? []).flatMap((i: any) => i.site_visit_photos.map((p: any) => p.file_path));
  const signedUrls = allPaths.length > 0 ? await getSignedPhotoUrls(allPaths) : {};

  return (
    <div>
      <PageHeader
        title={visit.buildings?.name ?? "Site Visit"}
        description={
          <>
            {formatDate(visit.visit_date)}
            {visit.visit_type ? ` · ${visit.visit_type}` : ""}
            {visit.attendees ? ` · ${visit.attendees}` : ""}
          </>
        }
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={visit.status} />
            <SiteVisitReportButton visit={visit as any} items={(items ?? []) as any} />
            <SiteVisitFormButton visit={visit} label="Edit" buildings={buildings ?? []} />
          </div>
        }
      />

      {visit.observations && (
        <div className="card mb-6">
          <h2 className="mb-2 text-sm font-semibold">General Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-charcoal-300">{visit.observations}</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-charcoal-100">Inspection Items</h2>
        <InspectionItemFormButton
          siteVisitId={visit.id}
          label="+ Add Item"
          tenants={tenants ?? []}
          contractors={contractors ?? []}
        />
      </div>

      {items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="card">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge label={item.category} className="bg-charcoal-600/60 text-charcoal-200" />
                    <Badge
                      label={enumLabel(item.risk_level)}
                      className={RISK_SEVERITY_CLASSES[item.risk_level] ?? ""}
                    />
                    {item.location && <span className="text-xs text-charcoal-400">{item.location}</span>}
                    {item.tenants && <span className="text-xs text-charcoal-400">· {item.tenants.trading_name}</span>}
                  </div>
                  <p className="text-sm text-charcoal-100">{item.description}</p>
                  {item.notes && <p className="mt-1 text-xs text-charcoal-400">{item.notes}</p>}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Badge label={enumLabel(item.status)} className="bg-charcoal-600/60 text-charcoal-200" />
                  <InspectionItemFormButton
                    siteVisitId={visit.id}
                    item={item}
                    label="Edit"
                    tenants={tenants ?? []}
                    contractors={contractors ?? []}
                  />
                </div>
              </div>
              {(item.target_date || item.contractors) && (
                <p className="mb-2 text-xs text-charcoal-400">
                  {item.contractors?.company_name || item.contractors?.contact_name
                    ? `Contractor: ${item.contractors.company_name ?? item.contractors.contact_name} · `
                    : ""}
                  {item.target_date ? `Target: ${formatDate(item.target_date)}` : ""}
                </p>
              )}
              <PhotoGallery
                itemId={item.id}
                siteVisitId={visit.id}
                photos={item.site_visit_photos}
                signedUrls={signedUrls}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-sm text-charcoal-400">
          No inspection items yet - add one to start capturing findings.
        </div>
      )}
    </div>
  );
}
