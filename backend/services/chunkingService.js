const normalizeWhitespace = (text) =>
  text.replace(/\r/g, "\n").replace(/\t/g, " ").replace(/\s+/g, " ").trim();

const estimateTokenCount = (text) => {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount * 1.3));
};

const splitTextIntoChunks = (
  text,
  { targetWords = 700, overlapWords = 120, minWords = 120 } = {}
) => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ").filter(Boolean);
  const chunks = [];

  for (let start = 0; start < words.length; start += targetWords - overlapWords) {
    const end = Math.min(words.length, start + targetWords);
    const slice = words.slice(start, end);

    if (slice.length < minWords && chunks.length > 0) {
      chunks[chunks.length - 1].text = `${chunks[chunks.length - 1].text} ${slice.join(" ")}`.trim();
      chunks[chunks.length - 1].metadata.endWord = words.length;
      chunks[chunks.length - 1].tokenEstimate = estimateTokenCount(chunks[chunks.length - 1].text);
      break;
    }

    chunks.push({
      text: slice.join(" ").trim(),
      tokenEstimate: estimateTokenCount(slice.join(" ")),
      metadata: {
        startWord: start,
        endWord: end,
      },
    });

    if (end >= words.length) {
      break;
    }
  }

  return chunks;
};

export { splitTextIntoChunks, estimateTokenCount };
