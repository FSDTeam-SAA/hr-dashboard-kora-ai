export const HR_ROLES = ["hr", "head_of_people"] as const;

export function normalizeRole(role?: string | null) {
  return String(role ?? "").trim().toLowerCase();
}

export function isHrRole(role?: string | null) {
  return (HR_ROLES as readonly string[]).includes(normalizeRole(role));
}

export function isHrLead(role?: string | null) {
  return normalizeRole(role) === "head_of_people";
}
