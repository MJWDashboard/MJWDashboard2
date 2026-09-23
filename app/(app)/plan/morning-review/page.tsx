import { getCarriedOverTasks, getPriorityCandidates } from "@/lib/planTasks";
import { getTodayEvents } from "@/lib/today";
import { MorningReviewClient } from "./MorningReviewClient";

export const metadata = { title: "Morning Review" };

export default async function MorningReviewPage() {
  const [carriedOver, candidates, events] = await Promise.all([
    getCarriedOverTasks(),
    getPriorityCandidates(),
    getTodayEvents(),
  ]);

  return <MorningReviewClient carriedOver={carriedOver} candidates={candidates} events={events} />;
}
