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
        "flex flex-col gap-1 rounded-lg border p-3 shadow-sm backdrop-blur-sm " +
        (className ?? "")
      }
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--poster-fg) 6%, transparent)",
      }}
    >
      <span
        className="text-[0.6rem] font-medium tracking-wider text-[var(--poster-fg-muted)] uppercase"
        style={{ fontFamily: "var(--poster-body-font)" }}
      >
        {label}
      </span>
      <span
        className="text-lg font-semibold tabular-nums leading-none text-[var(--poster-fg)]"
        style={{ fontFamily: "var(--poster-heading-font)" }}
      >
        {value}
      </span>
    </div>
  );
}
