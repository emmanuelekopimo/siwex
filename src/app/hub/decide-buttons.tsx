"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { decideAction } from "@/app/actions";
import type { FormState } from "@/lib/validation";

export function DecideButtons({ applicationId, name }: { applicationId: number; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(decideAction, {});
  return (
    <form action={action} className="stack" style={{ gap: 6, marginTop: 8 }}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="row" style={{ gap: 8 }}>
        <button className="btn success sm" name="decision" value="accepted" disabled={pending} aria-label={`Accept ${name}`}>
          <Check size={14} /> Accept
        </button>
        <button className="btn danger sm" name="decision" value="rejected" disabled={pending} aria-label={`Reject ${name}`}>
          <X size={14} /> Reject
        </button>
      </div>
      {state.message && !state.ok && <div className="alert error small" role="alert">{state.message}</div>}
    </form>
  );
}
