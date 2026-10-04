import { avatarUri } from "@/lib/avatar";
import { APPLICATION_LABEL, OPENING_STATUS_LABEL, type ApplicationDisplay, type OpeningStatus } from "@/lib/rules";

export { HubLogo } from "./brand";

export function Avatar({ name, size }: { name: string; size?: "sm" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`avatar ${size ?? ""}`} src={avatarUri(name)} alt="" width={40} height={40} />;
}

export function OpeningBadge({ status }: { status: OpeningStatus }) {
  return <span className={`badge ${status}`} data-testid="opening-status">{OPENING_STATUS_LABEL[status]}</span>;
}

export function ApplicationBadge({ status }: { status: ApplicationDisplay }) {
  return <span className={`badge ${status}`} data-testid="application-status">{APPLICATION_LABEL[status]}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/empty.svg" alt="" width={140} height={98} />
      {children}
    </div>
  );
}

export function Progress({ percent }: { percent: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}
