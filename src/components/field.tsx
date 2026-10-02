import type { FormState } from "@/lib/validation";

type Props = {
  name: string;
  label: string;
  state: FormState;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  min?: string;
  options?: { value: string; label: string }[];
  rows?: number;
};

/** Labelled input, select or textarea with an inline Zod error under it. */
export function Field({ name, label, state, type = "text", defaultValue, placeholder, className, autoComplete, min, options, rows }: Props) {
  const error = state.errors?.[name];
  const value = state.values?.[name] ?? defaultValue ?? "";
  const common = {
    id: name,
    name,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${name}-error` : undefined,
  };
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={name}>{label}</label>
      {options ? (
        // uncontrolled with defaultValue so React 19 form resets keep the choice
        <select key={value} {...common} defaultValue={value}>
          <option value="">Select...</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : rows ? (
        <textarea {...common} rows={rows} defaultValue={value} placeholder={placeholder} />
      ) : (
        <input {...common} type={type} defaultValue={value} placeholder={placeholder} autoComplete={autoComplete} min={min} />
      )}
      {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
    </div>
  );
}
