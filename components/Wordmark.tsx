import Image from "next/image";

/** Renders both theme variants; CSS (not JS) decides which one shows, so
 * there's no hydration mismatch and no flash on load. */
export function Wordmark({ width = 100, className }: { width?: number; className?: string }) {
  const height = Math.round(width * (300 / 900));
  return (
    <span className={className}>
      <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={width} height={height} priority className="wordmark-for-dark" />
      <Image src="/brand/wordmark.png" alt="Vorexa Core" width={width} height={height} priority className="wordmark-for-light" />
    </span>
  );
}
