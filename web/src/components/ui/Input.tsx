import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";

/* ---------- Input ---------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-text-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-[var(--radius-sm)] border border-border bg-surface text-text-primary",
            "px-3 py-2.5 text-sm placeholder:text-text-muted",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            "focus:outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--ring)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ---------- Textarea ---------- */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, id, className = "", ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm text-text-muted"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "w-full rounded-[var(--radius-sm)] border border-border bg-surface text-text-primary",
            "px-3 py-2.5 text-sm placeholder:text-text-muted resize-y",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            "focus:outline-none focus:border-brand focus:shadow-[0_0_0_4px_var(--ring)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea, type InputProps, type TextareaProps };
