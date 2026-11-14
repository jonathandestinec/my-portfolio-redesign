export function readingMinutes(source: string): number {
  const text = source
    .replace(/^export\s[^\n]*[{[(]\s*\n[\s\S]*?^[}\])][^\n]*$/gm, '')
    .replace(/^export\s.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
