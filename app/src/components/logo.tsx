import Image from "next/image";

export function Logo({ className = "", height = 32 }: { className?: string; height?: number }) {
  const width = Math.round((374 / 206) * height);
  return (
    <Image
      src="/logo.png"
      alt="Master Financiamentos"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
