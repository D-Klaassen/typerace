import { cn } from "@/lib/utils";

export interface Choice<T> {
  value: T;
  label: string;
  /** Small count shown next to the label, e.g. Votes. */
  badge?: number;
}

/** A row of mutually exclusive buttons backed by radio inputs. */
export function ChoiceGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
}: {
  legend: string;
  name: string;
  options: Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring",
              disabled ? "cursor-default opacity-70" : "cursor-pointer",
            )}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
            {option.badge !== undefined && option.badge > 0 && (
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                {option.badge}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
