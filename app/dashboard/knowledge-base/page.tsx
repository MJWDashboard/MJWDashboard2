import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { ArticleFormButton } from "./ArticleForm";
import { GenerateHandoverButton } from "./HandoverButton";
import { ArticleViewerButton } from "./ArticleViewer";

export default async function KnowledgeBasePage() {
  const supabase = createClient();

  const [{ data: articles }, { data: buildings }] = await Promise.all([
    supabase
      .from("knowledge_base_articles")
      .select("id, title, building_id, category, content, is_handover_summary, updated_at, buildings(name)")
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Portfolio knowledge base and handover summaries"
        action={
          <div className="flex items-center gap-3">
            <GenerateHandoverButton buildings={buildings ?? []} />
            <ArticleFormButton label="+ New Article" buildings={buildings ?? []} />
          </div>
        }
      />

      {articles && articles.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Title</th>
                <th>Building</th>
                <th>Category</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articles.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <ArticleViewerButton title={a.title} content={a.content} />
                    {a.is_handover_summary && (
                      <Badge label="Handover" className="ml-2 bg-cyan-600/20 text-cyan-400" />
                    )}
                  </td>
                  <td>{a.buildings?.name ?? "Portfolio-wide"}</td>
                  <td>{a.category ?? "—"}</td>
                  <td>{formatDate(a.updated_at)}</td>
                  <td className="text-right">
                    <ArticleFormButton article={a} label="Edit" buildings={buildings ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No knowledge base articles yet"
          description="Write handover notes or generate a summary for a building."
        />
      )}
    </div>
  );
}
