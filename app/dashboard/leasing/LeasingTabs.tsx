"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/StatusBadge";
import { LEASING_STAGE_CLASSES, VACANT_UNIT_STATUS_CLASSES, LEASING_TARGET_STATUS_CLASSES, enumLabel } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";
import { LeasingDealFormButton } from "./LeasingDealForm";
import { VacantUnitFormButton } from "./VacantUnitForm";
import { LeasingTargetFormButton } from "./LeasingTargetForm";
import { ApprovedRateFormButton } from "./ApprovedRateForm";
import { DocumentTemplateFormButton } from "./DocumentTemplateForm";
import { RenewalRiskList } from "./RenewalRiskList";

const TABS = ["Pipeline", "Vacant Units", "Renewals & Risk", "Target Lists", "Approved Rates", "Document Templates"] as const;
type Tab = (typeof TABS)[number];

export function LeasingTabs({
  deals,
  vacantUnits,
  targets,
  approvedRates,
  templates,
  renewals,
  buildings,
  tenants,
}: {
  deals: any[];
  vacantUnits: any[];
  targets: any[];
  approvedRates: any[];
  templates: any[];
  renewals: any[];
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
}) {
  const [tab, setTab] = useState<Tab>("Pipeline");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-charcoal-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-cyan-400 text-cyan-400"
                : "text-charcoal-400 hover:text-charcoal-200"
            }`}
          >
            {t}
            {t === "Renewals & Risk" && renewals.length > 0 && (
              <span className="ml-2 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">
                {renewals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Pipeline" && (
        <div>
          <div className="mb-4 flex justify-end">
            <LeasingDealFormButton
              label="+ Log Enquiry"
              buildings={buildings}
              tenants={tenants}
              vacantUnits={vacantUnits}
            />
          </div>
          {deals.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Prospect / Tenant</th>
                    <th>Building</th>
                    <th>Shop</th>
                    <th>Stage</th>
                    <th>Deal Value</th>
                    <th>Rate / m²</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id}>
                      <td className="font-medium">
                        <Link href={`/dashboard/leasing/${d.id}`} className="text-cyan-400 hover:underline">
                          {d.tenants?.trading_name ?? d.prospect_name ?? "—"}
                        </Link>
                      </td>
                      <td>{d.buildings?.name ?? "—"}</td>
                      <td>{d.shop_number ?? "—"}</td>
                      <td>
                        <Badge
                          label={enumLabel(d.stage)}
                          className={LEASING_STAGE_CLASSES[d.stage] ?? "bg-charcoal-600/60 text-charcoal-200"}
                        />
                      </td>
                      <td>{formatCurrency(d.deal_value)}</td>
                      <td>{d.rate_per_sqm ? formatCurrency(d.rate_per_sqm) : "—"}</td>
                      <td className="text-right">
                        <Link href={`/dashboard/leasing/${d.id}`} className="text-xs text-cyan-400 hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-charcoal-400">No leasing deals yet.</p>
          )}
        </div>
      )}

      {tab === "Vacant Units" && (
        <div>
          <div className="mb-4 flex justify-end">
            <VacantUnitFormButton label="+ Add Vacant Unit" buildings={buildings} />
          </div>
          {vacantUnits.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Building</th>
                    <th>Shop</th>
                    <th>Size (m²)</th>
                    <th>Asking Rate / m²</th>
                    <th>Available From</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {vacantUnits.map((u) => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.buildings?.name ?? "—"}</td>
                      <td>{u.shop_number ?? "—"}</td>
                      <td>{u.size_sqm ?? "—"}</td>
                      <td>{u.asking_rate_per_sqm ? formatCurrency(u.asking_rate_per_sqm) : "—"}</td>
                      <td>{u.availability_date ? formatDate(u.availability_date) : "—"}</td>
                      <td>
                        <Badge
                          label={enumLabel(u.status)}
                          className={VACANT_UNIT_STATUS_CLASSES[u.status] ?? ""}
                        />
                      </td>
                      <td className="text-right">
                        <VacantUnitFormButton unit={u} label="Edit" buildings={buildings} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-charcoal-400">No vacant units logged yet.</p>
          )}
        </div>
      )}

      {tab === "Renewals & Risk" && (
        <div>
          <p className="mb-4 text-sm text-charcoal-300">
            Active leases ending within the next 9 months. Log where each stands - renewal in progress, terms sent,
            tenant not renewing - and keep the discussion history against the lease.
          </p>
          <RenewalRiskList renewals={renewals} />
        </div>
      )}

      {tab === "Target Lists" && (
        <div>
          <div className="mb-4 flex justify-end">
            <LeasingTargetFormButton label="+ Add Target" buildings={buildings} />
          </div>
          {targets.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Building</th>
                    <th>Trade Category</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.company_name}</td>
                      <td>{t.buildings?.name ?? "—"}</td>
                      <td>{t.trade_category ?? "—"}</td>
                      <td>{t.contact_name ?? t.contact_email ?? t.contact_phone ?? "—"}</td>
                      <td>
                        <Badge
                          label={enumLabel(t.status)}
                          className={LEASING_TARGET_STATUS_CLASSES[t.status] ?? ""}
                        />
                      </td>
                      <td className="text-right">
                        <LeasingTargetFormButton target={t} label="Edit" buildings={buildings} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-charcoal-400">No leasing targets logged yet.</p>
          )}
        </div>
      )}

      {tab === "Approved Rates" && (
        <div>
          <div className="mb-4 flex justify-end">
            <ApprovedRateFormButton label="+ Add Approved Rate" buildings={buildings} />
          </div>
          {approvedRates.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Building</th>
                    <th>Category</th>
                    <th>Approved Rate / m²</th>
                    <th>Effective Date</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {approvedRates.map((r) => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.buildings?.name ?? "—"}</td>
                      <td>{r.category}</td>
                      <td>{formatCurrency(r.rate_per_sqm)}</td>
                      <td>{r.effective_date ? formatDate(r.effective_date) : "—"}</td>
                      <td className="max-w-xs truncate">{r.notes ?? "—"}</td>
                      <td className="text-right">
                        <ApprovedRateFormButton rate={r} label="Edit" buildings={buildings} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-charcoal-400">No approved rates on file yet.</p>
          )}
        </div>
      )}

      {tab === "Document Templates" && (
        <div>
          <div className="mb-4 flex justify-end">
            <DocumentTemplateFormButton label="+ New Template" />
          </div>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map((t) => (
                <div key={t.id} className="card">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-charcoal-100">{t.name}</h3>
                    <DocumentTemplateFormButton template={t} label="Edit" />
                  </div>
                  <ul className="list-inside list-disc text-sm text-charcoal-300">
                    {(t.items as string[]).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-charcoal-400">
              No document requirement templates yet - create one to apply to deals as enquiries come in.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
