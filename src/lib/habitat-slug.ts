import habitatMappingEn from "@/../content/habitat-mapping-en.json"

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function toHabitatSlug(id: number): string {
  const enName = (habitatMappingEn as Record<string, string>)[String(id)]
  if (enName) return toSlug(enName)
  return String(id)
}
