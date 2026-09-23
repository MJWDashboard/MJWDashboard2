import Image from "next/image";
import Link from "next/link";
import { LEGAL_LINKS, VOREXA_SITE_URL } from "@/lib/legal";

/** Shared legal footer per the Vorexa interface-language spec: rights
 * notice, Privacy/Terms/Security/POPIA-PAIA/Contact links and a return path
 * to vorexa.co.za. Used on the landing page, login screen and every legal
 * page so the structure is identical across the product. */
export function LegalFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/10 bg-[rgb(var(--color-midnight))] px-6 py-8 text-white/50 sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Image src="/brand/mark.png" alt="" width={16} height={13} />
          <span>
            © {year} Vorexa. All rights reserved. ·{" "}
            <Link href={VOREXA_SITE_URL} className="underline decoration-white/20 underline-offset-2 hover:text-white">
              vorexa.co.za
            </Link>
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
