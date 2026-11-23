export const PEOPLE_PURPOSES = [
  { value: "directory", label: "Work directory" },
  { value: "people_operations", label: "Assigned people operations" },
  { value: "recruiting", label: "Recruiting process" },
  { value: "absence_review", label: "Absence coordination" },
  { value: "performance_review", label: "Assigned performance review" },
];

export function resolvePeoplePurpose(value: string | null, fallback = "directory") {
  return PEOPLE_PURPOSES.some(p => p.value === value) ? value! : fallback;
}

export function peoplePurposeHref(href: string, purpose: string) {
  if (!href.startsWith("/") || href.startsWith("//")) throw new Error("An internal HR route is required");
  const url = new URL(href, "https://novya.invalid");
  url.searchParams.set("purpose", resolvePeoplePurpose(purpose));
  return url.pathname + url.search + url.hash;
}
