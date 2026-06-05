import { cn } from "@/lib/utils";
import Image from "next/image";
import logoImg from "@/public/pronnect-logo.png";

type PronnectLogoProps = {
  className?: string;
  /** Texto claro para fundos escuros (ex.: footer) */
  inverted?: boolean;
};

export function PronnectLogo({ className, inverted }: PronnectLogoProps) {
  return (
    <Image
      src={logoImg}
      alt="Pronnect"
      priority
      className={cn(
        "h-24 w-auto object-contain transition-all duration-300 dark:brightness-0 dark:invert",
        inverted && "brightness-0 invert",
        className
      )}
    />
  );
}

