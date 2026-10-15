import { useId } from "react";
import { cn } from "@/lib/utils";

export interface Opt { value: string; label: string; hint?: string }

export function Choice({ label, help, value, options, onChange, error }: {
  label: string; help?: string; value: string; options: Opt[]; onChange: (v: string) => void; error?: string | undefined;
}) {
  const id = useId();
  return (
    <fieldset className="space-y-2" aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="text-sm font-medium">{label}</legend>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div role="radiogroup" className="flex flex-wrap gap-2 pt-1">
        {options.map((o) => {
          const active = value === o.value;
          const muted = o.value === "unknown" || o.value === "not_checked" || o.value === "unclear";
          return (
            <label key={o.value} className={cn(
              "cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              active ? (muted ? "border-unknown bg-unknown/15 text-foreground" : "border-primary bg-primary/15 text-foreground") : "bg-surface text-muted-foreground hover:border-muted-foreground hover:text-foreground",
            )}>
              <input type="radio" name={id} value={o.value} checked={active} onChange={() => onChange(o.value)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
      {error && <p id={`${id}-err`} className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

export const TRI: Opt[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];
