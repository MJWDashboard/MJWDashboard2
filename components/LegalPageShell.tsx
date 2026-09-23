import Image from "next/image";
import Link from "next/link";
import { LegalFooter } from "./LegalFooter";
import { LEGAL_UPDATED } from "@/lib/legal";

/** Shared shell for the public legal pages (Privacy, Terms, Security,
 * POPIA/PAIA, Contact) — dark navy header consistent with the landing/login
 * brand panel, an off-white documentation surface for the content per the
 * Vorexa visual tokens, and the shared legal footer. */
export function LegalPageShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFC]">
      <header className="flex items-center justify-between bg-[rgb(var(--color-navy))] px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center">
          <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={130} height={43} />
        </Link>
        <Link href="/login" className="btn-primary px-5 py-2 text-sm">
          Sign in
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#0FAE9C]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0A1833]">{title}</h1>
        <p className="mt-2 text-sm text-[#5F6F86]">Last updated {LEGAL_UPDATED}</p>

        <div className="prose-legal mt-8 space-y-6 text-[15px] leading-relaxed text-[#0A1833]">{children}</div>

        <Link href="/" className="mt-10 inline-block text-sm text-[#0FAE9C] hover:underline">
          ← Back to Vorexa Core
        </Link>
      </main>

      <LegalFooter />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-[#0A1833]">{heading}</h2>
      <div className="space-y-3 text-[#33455F]">{children}</div>
    </section>
  );
}
