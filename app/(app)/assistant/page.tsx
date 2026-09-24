import { getAssistantHistory } from "@/lib/assistant";
import { AssistantClient } from "./AssistantClient";

export const metadata = { title: "Core Assistant" };

export default async function AssistantPage() {
  const history = await getAssistantHistory();
  return <AssistantClient history={history} hasApiKey={Boolean(process.env.ANTHROPIC_API_KEY)} />;
}
