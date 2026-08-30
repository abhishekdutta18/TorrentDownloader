export function sanitizeMagnetInput(raw: string): string {
  if (!raw) return ''
  let cleaned = raw.trim()
  // Remove surrounding angle brackets or quotes
  cleaned = cleaned.replace(/^<(.+)>$/, '$1').replace(/^["']|["']$/g, '').trim()
  // Replace HTML entity &amp; with &
  cleaned = cleaned.replace(/&amp;/g, '&')
  // Normalize magnet:? prefix if case is different (e.g. MAGNET:? or Magnet:?)
  if (/^magnet:\?/i.test(cleaned)) {
    return 'magnet:?' + cleaned.substring(cleaned.indexOf('?') + 1)
  }
  // Auto-convert raw 40-character hex SHA1 infohash or 32-character base32 infohash to magnet link
  if (/^[a-fA-F0-9]{40}$/.test(cleaned) || /^[a-zA-Z2-7]{32}$/.test(cleaned)) {
    return `magnet:?xt=urn:btih:${cleaned}`
  }
  return cleaned
}
