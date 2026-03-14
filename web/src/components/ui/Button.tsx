import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-brand text-white border-transparent hover:bg-brand-strong hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-surface text-text-primary border-border hover:bg-surface-muted hover:-translate-y-px active:translate-y-0",
  ghost:
    "bg-transparent text-text-muted border-transparent hover:text-text-primary hover:bg-surface-muted",
  danger:
    "bg-danger text-white border-transparent hover:brightness-92 hover:-translate-y-px active:translate-y-0",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 rounded-xl text-sm",
  lg: "px-6 py-3 rounded-xl text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "inline-flex items-center justify-center gap-2 border font-semibold",
          "transition-[transform,background,color,border-color] duration-160 ease-out",
          "cursor-pointer focus-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  }
);

Button.displayName = "Button";
export { Button, type ButtonProps };
