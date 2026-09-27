import type { CSSProperties } from "react";

export function BrandButton(): JSX.Element {
  const style: CSSProperties = {
    background: "var(--brand-primary)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 6,
  };
  return <button style={style}>Continue</button>;
}