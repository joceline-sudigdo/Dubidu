import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// kolom form sederhana (tanpa state client), dipakai di dalam ActionDialog / form Server Action

type Base = { label: string; name: string; hint?: string; className?: string };

export function Field({ label, name, hint, className, ...props }: Base & Omit<ComponentProps<"input">, "name">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="h-10 rounded-xl" {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextareaField({ label, name, hint, className, ...props }: Base & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} className="min-h-24 rounded-xl" {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  name,
  hint,
  className,
  options,
  ...props
}: Base & Omit<ComponentProps<"select">, "name"> & { options: { value: string; label: string }[] }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckboxField({ label, name, hint, className, ...props }: Base & Omit<ComponentProps<"input">, "name" | "type">) {
  return (
    <label className={cn("flex items-start gap-2.5 text-sm", className)}>
      <input type="checkbox" name={name} className="mt-0.5 size-4 accent-brand" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
