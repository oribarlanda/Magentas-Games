import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

// כדי לשנות לוגו בעתיד: החליפו את /public/logo.png
export default function Logo({ size = 36, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="לוגו החברה"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}
