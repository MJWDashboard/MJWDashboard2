import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";
import { CONTACT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Terms of Use">
      <LegalSection heading="Acceptance">
        <p>
          These terms apply to your use of Vorexa Core (this platform). By signing in, you agree to them. If you
          were given access on someone else&apos;s behalf, they remain responsible for how the account is used.
        </p>
      </LegalSection>

      <LegalSection heading="Access is invitation-only">
        <p>
          Vorexa Core is a private production platform. There is no public sign-up. Accounts are created by the
          platform administrator through the invite/admin flow. You are responsible for keeping your credentials
          confidential and for all activity under your account.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the platform only for lawful, personal record-keeping and planning.</li>
          <li>Do not attempt to bypass access controls, probe the platform for vulnerabilities without
            permission, or use it to store or transmit unlawful content.</li>
          <li>Do not use automated tools to scrape or overload the platform.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your data">
        <p>
          You own the records you enter into Vorexa Core. We process them to provide the service to you, as
          described in the <a href="/privacy" className="text-[#0FAE9C] hover:underline">Privacy Notice</a>. We
          do not claim ownership of your content.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          The Vorexa name, the Vorexa Core name, the sculpted interlocking Vorexa symbol, and the platform&apos;s
          design, code and branding are the property of Vorexa. Nothing in these terms grants you rights to
          Vorexa&apos;s trademarks or brand assets outside your use of the platform.
        </p>
      </LegalSection>

      <LegalSection heading="Availability">
        <p>
          Vorexa Core is under active development. Features described as available reflect the current
          production build; we do not guarantee uninterrupted availability and may take the platform down for
          maintenance or changes. We will make reasonable efforts to avoid data loss when we do.
        </p>
      </LegalSection>

      <LegalSection heading="Warranties and limitation of liability">
        <p>
          The platform is provided on an &quot;as is&quot; basis. To the extent permitted by law, Vorexa does
          not warrant that the platform will be error-free or uninterrupted, and is not liable for indirect or
          consequential loss arising from your use of it. Nothing in these terms limits liability that cannot
          lawfully be excluded under South African consumer protection law.
        </p>
      </LegalSection>

      <LegalSection heading="Suspension and termination">
        <p>
          We may suspend or terminate access if these terms are breached, or on reasonable notice for platform
          changes. You may request that your account and data be removed at any time by contacting us.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>These terms are governed by the laws of the Republic of South Africa, including the Electronic
          Communications and Transactions Act.</p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>Questions about these terms can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0FAE9C] hover:underline">{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
