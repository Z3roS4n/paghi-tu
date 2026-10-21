"use client";

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-ctl bg-paper-sunk p-[3px]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
          className="min-h-[38px] rounded-[3px] px-2.5 text-sm font-bold whitespace-nowrap text-ink-soft transition-colors aria-pressed:bg-paper-raised aria-pressed:text-ink aria-pressed:shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
