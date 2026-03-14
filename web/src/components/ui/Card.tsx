import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  muted?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ muted = false, className = "", ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "rounded-[var(--radius)] border border-border",
          muted
            ? "bg-surface-muted"
            : "bg-surface shadow-[var(--shadow)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
    );
  }
);

Card.displayName = "Card";
export { Card, type CardProps };
