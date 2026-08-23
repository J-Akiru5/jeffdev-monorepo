import type { ReactNode } from "react";
import { Badge } from "./Badge";

type CardProps = {
  title: string;
  badge?: string;
  children: ReactNode;
};

export function Card({ title, badge, children }: CardProps) {
  return (
    <div
      className="rounded-lg border border-neutral-200 p-6"
      style={{ backgroundColor: "white" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "var(--brand-dark)" }}>
          {title}
        </h2>
        {badge ? <Badge label={badge} /> : null}
      </div>
      <div className="text-sm text-neutral-600">{children}</div>
    </div>
  );
}
