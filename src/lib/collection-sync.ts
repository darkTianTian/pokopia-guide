const PRODUCTION_URL = "https://pokopiaguide.com"

/**
 * Encode a collection of caught pokemon slugs into a compact base64url string.
 * Uses a 300-bit bitmap (38 bytes) where each bit represents one pokemon.
 */
export function encodeCollection(
  caughtSlugs: ReadonlySet<string>,
  orderedSlugs: readonly string[]
): string {
  const byteLength = Math.ceil(orderedSlugs.length / 8)
  const bytes = new Uint8Array(byteLength)

  for (let i = 0; i < orderedSlugs.length; i++) {
    if (caughtSlugs.has(orderedSlugs[i])) {
      bytes[i >> 3] |= 1 << (7 - (i & 7))
    }
  }

  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/**
 * Decode a base64url bitmap string back into an array of caught pokemon slugs.
 * Returns null if the encoded string is invalid.
 */
export function decodeCollection(
  encoded: string,
  orderedSlugs: readonly string[]
): string[] | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const result: string[] = []
    for (let i = 0; i < orderedSlugs.length; i++) {
      if (bytes[i >> 3] & (1 << (7 - (i & 7)))) {
        result.push(orderedSlugs[i])
      }
    }

    return result
  } catch {
    return null
  }
}

/**
 * Build the full sync URL with the encoded collection in the hash.
 */
export function buildSyncUrl(encoded: string): string {
  return `${PRODUCTION_URL}/pokedex#sync=${encoded}`
}

/**
 * Extract the sync payload from a URL hash string.
 * Returns null if not a valid sync hash.
 */
export function parseSyncHash(hash: string): string | null {
  if (!hash.startsWith("#sync=")) return null
  const encoded = hash.slice(6)
  return encoded.length > 0 ? encoded : null
}
