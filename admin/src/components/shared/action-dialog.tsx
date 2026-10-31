"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/actions/helpers";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "danger" | "outline";

const BUTTON: Record<Tone, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  success: "bg-success text-white hover:bg-success/90",
  danger: "bg-danger text-white hover:bg-danger/90",
  outline: "border-border bg-white text-foreground hover:bg-brand-soft",
};

// dialog konfirmasi aksi admin: isi alasan (wajib untuk aksi berisiko) → Server Action → audit log
export function ActionDialog({
  action,
  hidden = {},
  triggerLabel,
  triggerIcon,
  triggerTone = "outline",
  triggerSize = "default",
  title,
  description,
  submitLabel,
  submitTone = "primary",
  reason,
  children,
  wide,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hidden?: Record<string, string>;
  triggerLabel: string;
  triggerIcon?: ReactNode;
  triggerTone?: Tone;
  triggerSize?: "default" | "sm";
  title: string;
  description?: string;
  submitLabel: string;
  submitTone?: Tone;
  // kolom alasan; quick = pilihan cepat yang mengisi teks
  reason?: { label: string; required?: boolean; placeholder?: string; quick?: string[] };
  children?: ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reasonText, setReasonText] = useState("");
  // tutup otomatis setelah berhasil
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.ok) {
      setOpen(false);
      setReasonText("");
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className={cn("rounded-xl font-semibold", BUTTON[triggerTone], triggerSize === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4")}
          />
        }>
        {triggerIcon}
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className={cn("gap-5 rounded-2xl p-6", wide ? "sm:max-w-xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-brand-dark">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {Object.entries(hidden).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}

          {children}

          {reason && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                {reason.label}
                {!reason.required && <span className="font-normal text-muted-foreground"> (opsional)</span>}
              </Label>
              {reason.quick && (
                <div className="flex flex-wrap gap-1.5">
                  {reason.quick.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setReasonText(q)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        reasonText === q ? "border-brand bg-brand-soft text-brand-dark" : "hover:bg-muted"
                      )}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                id="reason"
                name="reason"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                required={reason.required}
                minLength={reason.required ? 5 : undefined}
                placeholder={reason.placeholder ?? "Tulis alasan singkat, akan tercatat di audit log"}
                className="min-h-24 rounded-xl"
              />
            </div>
          )}

          {state?.error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </p>
          )}

          <DialogFooter className="-mx-6 -mb-6 rounded-b-2xl px-6">
            <DialogClose render={<Button variant="outline" className="h-10 rounded-xl" />}>Batal</DialogClose>
            <Button type="submit" disabled={pending} className={cn("h-10 rounded-xl font-semibold", BUTTON[submitTone])}>
              {pending && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
