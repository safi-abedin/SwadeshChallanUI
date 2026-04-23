export interface SearchHighlightSegment {
  text: string;
  matched: boolean;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchRegex(query: string): RegExp {
  try {
    return new RegExp(query, 'gi');
  } catch {
    return new RegExp(escapeRegex(query), 'gi');
  }
}

export function splitSearchHighlight(text: string, query: string): SearchHighlightSegment[] {
  if (!text) {
    return [];
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [{ text, matched: false }];
  }

  const regex = buildSearchRegex(trimmedQuery);
  const segments: SearchHighlightSegment[] = [];
  let lastIndex = 0;
  let hasHighlightedText = false;

  for (const match of text.matchAll(regex)) {
    const matchIndex = match.index ?? 0;
    const matchedText = match[0];

    if (matchedText.length === 0) {
      continue;
    }

    if (matchIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchIndex), matched: false });
    }

    segments.push({ text: matchedText, matched: true });
    hasHighlightedText = true;
    lastIndex = matchIndex + matchedText.length;
  }

  if (!hasHighlightedText) {
    return [{ text, matched: false }];
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), matched: false });
  }

  return segments;
}