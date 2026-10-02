"use client";

import { useActionState } from "react";
import { createOpeningAction } from "@/app/actions";
import { Field } from "@/components/field";
import { SIWES_WEEKS, TRACKS } from "@/lib/catalog";
import type { FormState } from "@/lib/validation";

export function OpeningForm({ today, defaultStart, defaultDeadline }: { today: string; defaultStart: string; defaultDeadline: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createOpeningAction, {});
  return (
    <form action={action} className="form-grid" noValidate key={state.ok ? "done" : "editing"}>
      {state.ok && <div className="alert success full" role="status">{state.message}</div>}
      <Field name="title" label="Role title" state={state} placeholder="e.g. Mobile Developer Intern" className="full" />
      <Field name="track" label="Track" state={state} options={TRACKS.map((t) => ({ value: t.id, label: t.label }))} />
      <Field name="durationWeeks" label="Length" state={state} defaultValue="24" options={SIWES_WEEKS.map((w) => ({ value: String(w), label: `${w} weeks` }))} />
      <Field name="slots" label="Slots" type="number" state={state} defaultValue="2" min="1" />
      <Field name="stipendNaira" label="Monthly stipend (NGN, 0 if unpaid)" type="number" state={state} defaultValue="0" min="0" />
      <Field name="deadline" label="Application deadline" type="date" state={state} defaultValue={defaultDeadline} min={today} />
      <Field name="startDate" label="Start date" type="date" state={state} defaultValue={defaultStart} min={today} />
      <Field name="description" label="What will the intern do?" state={state} rows={3} className="full" />
      {state.message && !state.ok && <div className="alert error full">{state.message}</div>}
      <button className="btn full" type="submit" disabled={pending}>{pending ? "Publishing..." : "Publish opening"}</button>
    </form>
  );
}
