"use client";

import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const next = useSearchParams().get("next") ?? "/";

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {state?.error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="admin@dubidu.id"
          defaultValue={state?.email}
          required
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            className="h-11 rounded-xl pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-sm font-semibold">
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        {pending ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
