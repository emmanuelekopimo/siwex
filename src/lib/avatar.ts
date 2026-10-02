import { createAvatar } from "@dicebear/core";
import { personas } from "@dicebear/collection";

/** Avatar generated locally from the person's name (no network request). */
export function avatarUri(seed: string): string {
  return createAvatar(personas, {
    seed,
    skinColor: ["92594b", "623d36", "b16a5b"],
    hairColor: ["362c47", "6c4545"],
    backgroundColor: ["f3edfe", "e6fafb", "fff3df"],
  }).toDataUri();
}

export function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
