export function MetricCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={
        "flex flex-col gap-0.5 px-1.5 " +
        (className ?? "")
      }
    >
      <span
        className="text-[0.55rem] font-medium tracking-wider text-[var(--poster-fg-muted)] uppercase"
        style={{ fontFamily: "var(--poster-body-font)" }}
      >
        {label}
      </span>
      <span
        className="text-sm font-semibold tabular-nums leading-none text-[var(--poster-fg)]"
        style={{ fontFamily: "var(--poster-heading-font)" }}
      >
        {value}
      </span>
    </div>
  );
}