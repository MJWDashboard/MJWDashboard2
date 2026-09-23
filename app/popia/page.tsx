import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: "POPIA / PAIA" };

export default function PopiaPaiaPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="POPIA &amp; PAIA">
      <LegalSection heading="POPIA — how this fits together">
        <p>
          Vorexa processes personal information, including health-related information which is &quot;special
          personal information&quot; under the Protection of Personal Information Act 4 of 2013 (POPIA), and
          Vault records that may include identity and credential-related information. The categories processed,
          the purpose, retention approach and your rights are set out in full in the{" "}
          <Link href="/privacy" className="text-[#0FAE9C] hover:underline">Privacy Notice</Link>; this page
          focuses on the POPIA/PAIA-specific detail.
        </p>
      </LegalSection>

      <LegalSection heading="Special personal information (health data)">
        <p>
          Health module entries — medicines, doses, appointments and weight — are processed only to provide the
          Health module to the account holder who entered them. They are not shared with any third party, are
          not used for any secondary purpose, and are protected by the idle-lock behaviour described on the{" "}
          <Link href="/security" className="text-[#0FAE9C] hover:underline">Security page</Link>.
        </p>
      </LegalSection>

      <LegalSection heading="Information Officer">
        <p>
          Vorexa&apos;s Information Officer registration with the Information Regulator
          (<Link href="https://inforegulator.org.za/" className="text-[#0FAE9C] hover:underline">inforegulator.org.za</Link>)
          is in progress. Verified Information Officer particulars will be published here once registration is
          complete — they are not estimated or invented in the interim. Until then, direct POPIA requests to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection heading="PAIA — access to information">
        <p>
          The Promotion of Access to Information Act 2 of 2000 (PAIA) gives you the right to request access to
          records we hold. A formal PAIA manual is being prepared. In the meantime, PAIA requests can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>, and
          general guidance on the Act is available at{" "}
          <Link href="https://justice.gov.za/paia/paia.htm" className="text-[#0FAE9C] hover:underline">justice.gov.za/paia</Link>.
        </p>
      </LegalSection>

      <LegalSection heading="Lodging a complaint">
        <p>
          If you are unsatisfied with how a request was handled, you may lodge a complaint with the Information
          Regulator at{" "}
          <Link href="https://inforegulator.org.za/" className="text-[#0FAE9C] hover:underline">inforegulator.org.za</Link>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
