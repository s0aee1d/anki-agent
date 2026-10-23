const BOUNDARY = /[.!?\n]/;

/** The sentence of `block` that contains `selection`, or "" when the selection is not in it. */
export function sentenceAround(block: string, selection: string, max = 300): string {
  const needle = selection.trim();
  const at = needle ? block.indexOf(needle) : -1;
  if (at < 0) return "";
  let start = at;
  while (start > 0 && !BOUNDARY.test(block[start - 1])) start--;
  let end = at + needle.length;
  while (end < block.length && !BOUNDARY.test(block[end])) end++;
  if (end < block.length && block[end] !== "\n") end++; // keep the closing punctuation
  return block.slice(start, end).replace(/\s+/g, " ").trim().slice(0, max);
}
