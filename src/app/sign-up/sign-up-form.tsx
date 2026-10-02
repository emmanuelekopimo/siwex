"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/actions";
import { Field } from "@/components/field";
import { CITIES, COURSES, LEVELS, SIWES_WEEKS, TRACKS } from "@/lib/catalog";
import type { FormState } from "@/lib/validation";

const opts = (xs: (string | number)[], suffix = "") => xs.map((x) => ({ value: String(x), label: `${x}${suffix}` }));

export function SignUpForm({ role }: { role: "student" | "hub" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signUpAction, {});
  return (
    <form action={action} className="form-grid" noValidate>
      <input type="hidden" name="role" value={role} />
      <Field name="name" label="Full name" state={state} placeholder="e.g. Aniekan Bassey" autoComplete="name" />
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" />
      <Field name="password" label="Password" type="password" state={state} autoComplete="new-password" placeholder="At least 8 characters" />
      {role === "student" ? (
        <>
          <Field name="school" label="School" state={state} placeholder="e.g. University of Uyo" />
          <Field name="course" label="Course" state={state} options={opts(COURSES)} />
          <Field name="level" label="Level" state={state} options={opts(LEVELS, " level")} />
          <Field name="city" label="City" state={state} options={opts(CITIES)} />
          <Field name="requiredWeeks" label="SIWES length" state={state} options={SIWES_WEEKS.map((w) => ({ value: String(w), label: `${w} weeks (${w / 4} months)` }))} />
        </>
      ) : (
        <>
          <Field name="hubName" label="Hub name" state={state} placeholder="e.g. Ikot Ekpene Tech Hub" />
          <Field name="city" label="City" state={state} options={opts(CITIES)} />
          <Field name="address" label="Street address" state={state} className="full" />
          <Field name="about" label="About the hub" state={state} rows={3} className="full" />
          <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="bold small" style={{ marginBottom: 6 }}>Tracks you offer</legend>
            <div className="checks">
              {TRACKS.map((t) => (
                <label className="check" key={t.id}>
                  <input type="checkbox" name="tracks" value={t.id} /> {t.label}
                </label>
              ))}
            </div>
            {state.errors?.tracks && <span className="field-error">{state.errors.tracks}</span>}
          </fieldset>
        </>
      )}
      {state.message && <div className="alert error full">{state.message}</div>}
      <button className="btn full" type="submit" disabled={pending}>{pending ? "Creating account..." : "Create account"}</button>
    </form>
  );
}
