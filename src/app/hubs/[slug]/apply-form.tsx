"use client";

import { useActionState } from "react";
import { applyAction } from "@/app/actions";
import type { FormState } from "@/lib/validation";

export function ApplyForm({ openingId }: { openingId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyAction, {});
  if (state.ok) {
    return <div className="alert success" role="status">{state.message}</div>;
  }
  return (
    <form action={action} className="stack" style={{ gap: 8 }} noValidate>
      <input type="hidden" name="openingId" value={openingId} />
      <div className="field">
        <label htmlFor={`note-${openingId}`}>Why do you want this placement?</label>
        <textarea
          id={`note-${openingId}`}
          name="note"
          rows={3}
          defaultValue={state.values?.note}
          aria-invalid={Boolean(state.errors?.note)}
          aria-describedby={state.errors?.note ? `note-err-${openingId}` : undefined}
          placeholder="Tell the hub what you study and what you want to learn"
        />
        {state.errors?.note && <span className="field-error" id={`note-err-${openingId}`}>{state.errors.note}</span>}
      </div>
      {state.message && <div className="alert error" role="alert">{state.message}</div>}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Sending..." : "Send application"}</button>
    </form>
  );
}
