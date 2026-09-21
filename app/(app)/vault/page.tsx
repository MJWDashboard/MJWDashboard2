import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Vault" };

export default function VaultPage() {
  return (
    <ModulePlaceholder
      icon={ShieldCheck}
      title="Vault"
      phase="Phase 4"
      scope={[
        "Documents, policies and the will, with encrypted reference numbers",
        "Open matters tracker — the estate file, SARS, Master, Public Protector",
        "Credentials register (2FA method, last change — never the secrets)",
        "Emergency sheet for an executor",
      ]}
    />
  );
}
