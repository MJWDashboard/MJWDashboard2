import { getInsights } from "@/lib/insights";
import { InsightsClient } from "./InsightsClient";

export const metadata = { title: "Insights" };

export default async function InsightsPage() {
  const insights = await getInsights();
  return <InsightsClient insights={insights} />;
}
