// Modules whose imports can be safely reversed through the generic
// archive-or-restore mechanism in app/dashboard/audit-log/actions.ts: each
// row maps to exactly one record in one table, so "undo" is just
// re-archiving a created row or restoring an updated row's previous_data.
//
// Left out on purpose: tenants (a create writes two tables - tenants and
// leases - via the create_tenant_with_lease RPC) and arrears (an import
// writes both arrears_current and a permanent arrears_history row, and
// history is never meant to be erased). Both are still batch-tracked for
// audit purposes, just not auto-reversible yet.
export const REVERSIBLE_IMPORT_MODULES = new Set(["buildings", "turnovers", "contacts", "contractors"]);
