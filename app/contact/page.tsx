import type { Metadata } from "next";
import Link from "next/link";
import { Mail, LifeBuoy } from "lucide-react";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: "Contact & Support" };

export default function ContactPage() {
  return (
    <LegalPageShell eyebrow="Support" title="Contact &amp; support">
      <LegalSection heading="Already have access?">
        <p className="flex items-start gap-2">
          <LifeBuoy size={18} className="mt-0.5 shrink-0 text-[#0FAE9C]" />
          <span>
            Sign in and use <strong>Settings → Report a problem</strong> to log a fault ticket — it reaches the
            platform administrator directly and gives you a ticket number to track.
          </span>
        </p>
      </LegalSection>

      <LegalSection heading="Everything else">
        <p className="flex items-start gap-2">
          <Mail size={18} className="mt-0.5 shrink-0 text-[#0FAE9C]" />
          <span>
            For access requests, privacy/POPIA/PAIA questions, security reports or anything else, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>.
          </span>
        </p>
      </LegalSection>

      <LegalSection heading="Looking for the rest of Vorexa?">
        <p>
          Vorexa Core is one product in the Vorexa family. Visit{" "}
          <Link href="https://vorexa.co.za" className="text-[#0FAE9C] hover:underline">vorexa.co.za</Link> for the
          main Vorexa site and other Vorexa products.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
