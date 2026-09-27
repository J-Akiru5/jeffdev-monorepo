import type { CSSProperties } from "react";

export function InfoPill({ children }: { children: React.ReactNode }): JSX.Element {
  const style: CSSProperties = {
    background: "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
    color: "var(--brand-primary)",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    display: "inline-block",
  };
  return <span style={style}>{children}</span>;
}
