import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Security">
      <p className="text-[#33455F]">
        This page describes controls that are actually implemented in the current production build. We update
        it as the platform changes rather than describe protections that don&apos;t exist yet.
      </p>

      <LegalSection heading="Access model">
        <p>
          Vorexa Core has no public sign-up. Accounts are created by the platform administrator through an
          invite-only flow, and account creation through any other path is blocked at the database level.
        </p>
      </LegalSection>

      <LegalSection heading="Row-level data isolation">
        <p>
          Every table in the database is protected by row-level security policies scoped to the signed-in
          account (<code>owner_id = auth.uid()</code>). One account cannot read or modify another account&apos;s
          records through the application.
        </p>
      </LegalSection>

      <LegalSection heading="Sensitive-area locking">
        <p>
          The Health and Vault areas re-lock after 15 minutes of inactivity and require your account password to
          re-enter. A one-tap privacy blur hides sensitive values (amounts, health figures) anywhere on screen
          without navigating away.
        </p>
      </LegalSection>

      <LegalSection heading="Audit logging">
        <p>
          Actions taken in the Vault module (creating, updating and deleting documents) are recorded to an
          append-only audit log. Audit coverage is being extended to other sensitive areas over time.
        </p>
      </LegalSection>

      <LegalSection heading="Data in transit and at rest">
        <p>
          All traffic to the platform is served over HTTPS/TLS. Data is stored in a managed Postgres database
          (Supabase). We do not currently claim field-level encryption for Vault or Health records beyond what
          the underlying infrastructure provider offers by default — we will update this page if and when that
          is independently verified, rather than describe it as &quot;encrypted&quot; in advance.
        </p>
      </LegalSection>

      <LegalSection heading="Google Calendar connection">
        <p>
          If you connect a Google account, we request the minimum scopes needed to read your calendar events
          (<code>calendar</code>, <code>openid</code>, <code>email</code>). The connection is one-way: we read
          your events, we do not write to your Google Calendar. You can disconnect at any time from Settings.
        </p>
      </LegalSection>

      <LegalSection heading="Reporting a concern">
        <p>
          If you believe you have found a security issue, please report it to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>{" "}
          rather than testing it against live account data. We will acknowledge reports and work through the fix
          with you.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
