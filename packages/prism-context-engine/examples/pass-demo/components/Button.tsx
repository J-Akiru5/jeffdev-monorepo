import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className="rounded-md px-4 py-2 text-sm font-medium"
      style={{
        backgroundColor: "var(--brand-primary)",
        color: "var(--text-on-brand)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
