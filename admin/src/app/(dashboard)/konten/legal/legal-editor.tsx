"use client";

import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLegalAction } from "@/lib/actions/content";
import type { LegalDoc } from "@/types/content";

type Section = { key: number; h: string; p: string };

// editor bagian-bagian dokumen legal: tambah, hapus, urutkan, lalu simpan sebagai versi baru
export function LegalEditor({ doc }: { doc: LegalDoc }) {
  const [state, action, pending] = useActionState(updateLegalAction, undefined);
  const [sections, setSections] = useState<Section[]>(() => doc.sections.map((s, i) => ({ ...s, key: i })));

  const update = (key: number, field: "h" | "p", value: string) =>
    setSections((list) => list.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  const move = (index: number, dir: -1 | 1) =>
    setSections((list) => {
      const next = [...list];
      [next[index], next[index + dir]] = [next[index + dir], next[index]];
      return next;
    });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={doc.type} />

      {sections.map((s, i) => (
        <div key={s.key} className="space-y-3 rounded-2xl border bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand-dark">{i + 1}</span>
            <Input
              name="h"
              value={s.h}
              onChange={(e) => update(s.key, "h", e.target.value)}
              placeholder="Judul bagian"
              className="h-10 flex-1 rounded-xl font-semibold"
              aria-label={`Judul bagian ${i + 1}`}
            />
            <Button type="button" variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Naikkan">
              <ArrowUp />
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label="Turunkan">
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => setSections((list) => list.filter((x) => x.key !== s.key))}
              aria-label="Hapus bagian">
              <Trash2 />
            </Button>
          </div>
          <Textarea
            name="p"
            value={s.p}
            onChange={(e) => update(s.key, "p", e.target.value)}
            placeholder="Isi bagian"
            className="min-h-28 rounded-xl leading-relaxed"
            aria-label={`Isi bagian ${i + 1}`}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() => setSections((list) => [...list, { key: Date.now(), h: "", p: "" }])}>
        <Plus /> Tambah bagian
      </Button>

      <div className="sticky bottom-4 space-y-3 rounded-2xl border bg-white p-5 shadow-lg shadow-brand-dark/10">
        <div className="space-y-1.5">
          <Label htmlFor="reason">Ringkasan perubahan</Label>
          <Input id="reason" name="reason" required minLength={5} placeholder="Misal: menambahkan aturan pencairan dana" className="h-10 rounded-xl" />
        </div>
        {state?.error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="size-4" /> {state.error}
          </p>
        )}
        {state?.ok && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" /> {state.message}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-10 rounded-xl px-5 font-semibold">
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Simpan versi baru
        </Button>
      </div>
    </form>
  );
}
