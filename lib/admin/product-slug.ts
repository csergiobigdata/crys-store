export function normalizeProductName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function slugifyProductName(name: string) {
  return normalizeProductName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function suggestUniqueIdentifier(base: string, existing: Set<string>) {
  if (!existing.has(base)) return base;

  let suffix = 1;
  while (existing.has(`${base}-${String(suffix).padStart(4, "0")}`)) {
    suffix += 1;
  }
  return `${base}-${String(suffix).padStart(4, "0")}`;
}
