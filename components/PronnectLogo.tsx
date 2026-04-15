import { cn } from "@/lib/utils";

type PronnectLogoProps = {
  className?: string;
  /** Texto claro para fundos escuros (ex.: footer) */
  inverted?: boolean;
};

export function PronnectLogo({ className, inverted }: PronnectLogoProps) {
  return (
    <span
      className={cn(
        "font-headline text-2xl font-bold tracking-tight text-primary md:text-[1.75rem]",
        inverted && "text-white",
        className
      )}
    >
      Pronnect
    </span>
  );
}
