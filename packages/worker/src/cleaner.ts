export interface CleanResult {
  text: string;
  snippet: string;
  hasChanged: boolean;
  diffLines: string[];
}

export function cleanContent(currentText: string, previousText?: string | null): CleanResult {
  const cleaned = currentText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20)
    .join('\n');

  const snippet = cleaned.slice(0, 3000);

  if (!previousText) {
    return { text: cleaned, snippet, hasChanged: false, diffLines: [] };
  }

  const prevCleaned = previousText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 20)
    .join('\n');

  const prevSet = new Set(prevCleaned.split('\n'));
  const diffLines = cleaned.split('\n').filter((l) => !prevSet.has(l));

  return {
    text: cleaned,
    snippet,
    hasChanged: diffLines.length > 0,
    diffLines: diffLines.slice(0, 100),
  };
}
