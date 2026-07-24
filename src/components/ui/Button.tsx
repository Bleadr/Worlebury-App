import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

// Bronze is the brand's "point of judgement" — reserved for primary actions
// (buttons, active states), never used as a broad fill.
const variants = {
  primary: "bg-accent text-white hover:bg-accent-dark",
  secondary: "bg-surface text-ink border border-border hover:bg-surface-muted",
  ghost: "text-ink-muted hover:bg-surface-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" };

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
