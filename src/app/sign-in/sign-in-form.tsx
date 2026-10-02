"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions";
import { Field } from "@/components/field";
import type { FormState } from "@/lib/validation";

export function SignInForm({ email, password, next }: { email: string; password: string; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, {});
  return (
    <form action={action} className="stack" style={{ gap: 14 }} noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field name="email" label="Email" type="email" state={state} defaultValue={email} autoComplete="email" />
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" defaultValue={password} autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.password)} />
        {state.errors?.password && <span className="field-error">{state.errors.password}</span>}
      </div>
      {state.message && <div className="alert error" role="alert">{state.message}</div>}
      <button className="btn block" type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}
