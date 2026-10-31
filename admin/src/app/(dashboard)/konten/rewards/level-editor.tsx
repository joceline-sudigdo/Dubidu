"use client";

import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { useActionState } from "react";

import { Field } from "@/components/shared/form-fields";
import { Button } from "@/components/ui/button";
import { updateLevelsAction } from "@/lib/actions/content";
import type { RewardLevel } from "@/types/content";

// ubah nama, batas ikan, dan keistimewaan tiap level sekaligus
export function LevelEditor({ levels }: { levels: RewardLevel[] }) {
  const [state, action, pending] = useActionState(updateLevelsAction, undefined);

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-white p-5">
      {levels.map((l) => (
        <div key={l.level} className="grid items-end gap-3 sm:grid-cols-[56px_1fr_150px_1fr]">
          <span className="pb-2.5 text-sm font-bold text-brand-dark">Lv {l.level}</span>
          <Field label="Nama" name={`name_${l.level}`} defaultValue={l.name} required />
          <Field
            label="Mulai (ikan)"
            name={`min_${l.level}`}
            type="number"
            min={0}
            defaultValue={l.min}
            readOnly={l.level === 1}
            hint={l.level === 1 ? "Level awal selalu 0" : undefined}
          />
          <Field label="Keistimewaan" name={`perk_${l.level}`} defaultValue={l.perk ?? ""} placeholder="—" />
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-3 border-t pt-4">
        <Field label="Alasan perubahan" name="reason" required minLength={5} className="min-w-64 flex-1" />
        <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5 font-semibold">
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Simpan level
        </Button>
      </div>
      {state?.error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="size-4" /> {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" /> Level tersimpan.
        </p>
      )}
    </form>
  );
}
