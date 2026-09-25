// Display form of a free-text team/coach name: trimmed, inner whitespace collapsed.
export function cleanName(name) {
  return String(name ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ')
}

// Grouping key: "Real  Madrid " and "real madrid" share a key.
export function normalizeName(name) {
  return cleanName(name).toLowerCase()
}
