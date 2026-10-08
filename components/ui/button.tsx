import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rose text-white hover:bg-rose-dark shadow-card hover:shadow-card-hover",
  outline:
    "border-2 border-rose/40 bg-white/60 text-rose-dark hover:border-rose hover:bg-rose-light/50",
  ghost: "text-plum hover:bg-rose-light/50 bg-transparent",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: CommonProps & ComponentProps<typeof Link> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
