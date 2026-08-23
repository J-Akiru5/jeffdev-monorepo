type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
      style={{
        backgroundColor: "var(--brand-accent)",
        color: "var(--text-on-brand)",
      }}
    >
      {label}
    </span>
  );
}
