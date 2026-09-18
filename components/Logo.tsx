import Image from "next/image";

const SIZES = {
  sm: { mark: 28, wordmarkWidth: 96, gap: "gap-2" },
  md: { mark: 36, wordmarkWidth: 128, gap: "gap-2.5" },
  lg: { mark: 56, wordmarkWidth: 200, gap: "gap-4" },
} as const;

export function Logo({
  size = "sm",
  variant = "light",
  className = "",
}: {
  size?: keyof typeof SIZES;
  variant?: "light" | "dark";
  className?: string;
}) {
  const { mark, wordmarkWidth, gap } = SIZES[size];
  const wordmarkSrc =
    variant === "light" ? "/vorexa-wordmark-light.png" : "/vorexa-wordmark.png";

  return (
    <span className={`inline-flex items-center ${gap} ${className}`}>
      <Image
        src="/vorexa-mark.png"
        alt=""
        width={mark}
        height={mark}
        className="shrink-0"
        priority
      />
      <Image
        src={wordmarkSrc}
        alt="Vorexa"
        width={wordmarkWidth}
        height={(wordmarkWidth * 240) / 2116}
        priority
      />
    </span>
  );
}
