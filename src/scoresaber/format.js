export function extractDiffAndType(ssDiff) {
  const match = /^_([^_]+)_Solo(.*)$/.exec(ssDiff);
  if (!match) return null;

  return {
    diff: match[1].toLowerCase().replace('plus', 'Plus'),
    type: match[2] ?? 'Standard'
  };
}