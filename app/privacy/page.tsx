import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Privacy Notice">
      <LegalSection heading="Who this notice covers">
        <p>
          This notice explains how Vorexa Core, a Vorexa product, processes personal information under the
          Protection of Personal Information Act 4 of 2013 (POPIA). Vorexa Core is a private, single-owner
          platform: there is no public sign-up, and each deployment holds the records of one account holder.
        </p>
        <p>
          Vorexa is a South African business. Its full registered legal name, entity status and verified CIPC
          registration details will be published here once finalised — they are not invented or estimated in
          this notice.
        </p>
      </LegalSection>

      <LegalSection heading="What we process">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account information — your email address and authentication credentials (handled by Supabase Auth).</li>
          <li>Profile information — first name, surname, and your theme/privacy preferences.</li>
          <li>Records you choose to enter — Health (medicines, doses, appointments, weight), Notes &amp; Lists,
            Calendar events and important dates, Money (accounts, transactions, budgets, debts), Vehicle &amp;
            Travel (vehicles, fuel, trips, services), Home &amp; Pets, and Vault documents, policies and
            credentials, including any files you attach.</li>
          <li>Google Calendar data — if you connect a Google account, we request the <code>calendar</code>,{" "}
            <code>openid</code> and <code>email</code> scopes to read your events for the next 90 days and mirror
            them into your Calendar module. This is one-way (Google → Vorexa Core); we do not write events back
            to your Google Calendar.</li>
          <li>Support tickets — the subject and message you submit when reporting a problem.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Purpose of processing">
        <p>
          We process this information to operate the platform for you: authenticating your account, displaying
          and organising your records, computing the Today view and reminders, syncing your connected Google
          Calendar, and responding to support requests. We do not use your personal information for marketing,
          advertising or profiling, and we do not sell it.
        </p>
      </LegalSection>

      <LegalSection heading="Recipients and operators">
        <p>We use a small number of infrastructure providers (operators, in POPIA terms) to run the platform:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Supabase</strong> — database, authentication and file storage.</li>
          <li><strong>Vercel</strong> — application hosting and delivery.</li>
          <li><strong>Google</strong> — only if and when you connect your Google Calendar account.</li>
        </ul>
        <p>We do not share your records with any other third party.</p>
      </LegalSection>

      <LegalSection heading="Retention">
        <p>
          We retain your records for as long as your account remains active, so the platform continues to work
          as your ongoing personal record. If you ask us to close your account, we delete your records within a
          reasonable period, other than information we are required to keep for legal or accounting reasons.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>Under POPIA you have the right to request access to, correction of, or deletion of your personal
          information, to object to processing, and to lodge a complaint with the Information Regulator
          (<Link href="https://inforegulator.org.za/" className="text-[#0FAE9C] hover:underline">inforegulator.org.za</Link>).
          To exercise any of these, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection heading="Security measures">
        <p>
          Every table in the database is scoped with row-level security so records are only readable by the
          account that owns them. The Health and Vault areas lock after 15 minutes of inactivity and require
          your account password to re-enter. A one-tap privacy blur hides sensitive values on screen. See the{" "}
          <Link href="/security" className="text-[#0FAE9C] hover:underline">Security page</Link> for detail. We
          avoid claims we cannot evidence — for example, we do not describe Vault or Health fields as
          field-level encrypted unless that is independently verified.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics and telemetry">
        <p>No third-party analytics, advertising or tracking scripts are active on this platform. If that
          changes, this notice will be updated to disclose exactly what is in use.</p>
      </LegalSection>

      <LegalSection heading="Changes to this notice">
        <p>We may update this notice as the platform changes. Material changes will be reflected in the
          &quot;Last updated&quot; date above.</p>
      </LegalSection>

      <LegalSection heading="Contact / Information Officer">
        <p>
          For privacy requests, contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>.
          Information Officer registration with the Information Regulator is in progress; formal Information
          Officer particulars will be published here once registered.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
