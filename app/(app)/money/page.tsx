import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Money" };

export default function MoneyPage() {
  return (
    <ModulePlaceholder
      icon={Wallet}
      title="Money"
      phase="Phase 2"
      scope={[
        "Accounts, statement import and budget categories",
        "Available cash — cash accounts only, credit shown separately",
        "Debt payoff planner and dispute tracker",
        "SARS tax-year workspace",
      ]}
    />
  );
}
