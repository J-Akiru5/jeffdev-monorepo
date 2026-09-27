import type { CSSProperties } from "react";

export function InfoPill({ children }: { children: React.ReactNode }): JSX.Element {
  const style: CSSProperties = {
    display: "inline-block",
    background: "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
    color: "var(--brand-primary)",
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
  return <span style={style}>{children}</span>;
}
