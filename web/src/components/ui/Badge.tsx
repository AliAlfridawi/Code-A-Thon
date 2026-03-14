import { type HTMLAttributes } from "react";

type BadgeVariant = "brand" | "warning" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  brand: "bg-brand/16 text-brand",
  warning: "bg-accent/20 text-amber-800 dark:text-accent",
  muted: "bg-surface-muted text-text-muted",
};

export function Badge({
  variant = "brand",
  className = "",
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
