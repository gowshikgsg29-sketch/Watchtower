export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface SplitDiffRow {
  oldLineNumber?: number;
  oldContent?: string;
  newLineNumber?: number;
  newContent?: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

/**
 * Computes line-by-line diff between two text documents.
 * Uses a Longest Common Subsequence (LCS) approach for clean diff output.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS Matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build the diff
  let i = m;
  let j = n;
  const result: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        content: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        content: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        content: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  return result;
}

/**
 * Converts line diff into aligned rows for side-by-side comparison view
 */
export function computeSplitDiff(oldText: string, newText: string): SplitDiffRow[] {
  const diffLines = computeLineDiff(oldText, newText);
  const rows: SplitDiffRow[] = [];

  let idx = 0;
  while (idx < diffLines.length) {
    const item = diffLines[idx];

    if (item.type === 'unchanged') {
      rows.push({
        type: 'unchanged',
        oldLineNumber: item.oldLineNumber,
        oldContent: item.content,
        newLineNumber: item.newLineNumber,
        newContent: item.content,
      });
      idx++;
    } else if (item.type === 'removed') {
      // Check if followed by an added line (replacement)
      if (idx + 1 < diffLines.length && diffLines[idx + 1].type === 'added') {
        const nextItem = diffLines[idx + 1];
        rows.push({
          type: 'modified',
          oldLineNumber: item.oldLineNumber,
          oldContent: item.content,
          newLineNumber: nextItem.newLineNumber,
          newContent: nextItem.content,
        });
        idx += 2;
      } else {
        rows.push({
          type: 'removed',
          oldLineNumber: item.oldLineNumber,
          oldContent: item.content,
        });
        idx++;
      }
    } else if (item.type === 'added') {
      rows.push({
        type: 'added',
        newLineNumber: item.newLineNumber,
        newContent: item.content,
      });
      idx++;
    }
  }

  return rows;
}

/**
 * Computes words added and removed between two texts
 */
export function countWordChanges(oldText: string, newText: string) {
  const oldWords = oldText.trim().split(/\s+/).filter(Boolean);
  const newWords = newText.trim().split(/\s+/).filter(Boolean);

  const oldSet = new Map<string, number>();
  for (const w of oldWords) {
    oldSet.set(w, (oldSet.get(w) || 0) + 1);
  }

  let added = 0;
  const newCount = new Map<string, number>();
  for (const w of newWords) {
    newCount.set(w, (newCount.get(w) || 0) + 1);
  }

  for (const [w, count] of newCount.entries()) {
    const prev = oldSet.get(w) || 0;
    if (count > prev) {
      added += count - prev;
    }
  }

  let removed = 0;
  for (const [w, count] of oldSet.entries()) {
    const now = newCount.get(w) || 0;
    if (count > now) {
      removed += count - now;
    }
  }

  return { added, removed };
}

/**
 * Computes DOM similarity percentage between two normalized texts
 */
export function computeSimilarityPercent(oldText: string, newText: string): number {
  if (!oldText && !newText) return 100;
  if (!oldText || !newText) return 0;
  if (oldText === newText) return 100;

  const oldWords = oldText.trim().split(/\s+/).filter(Boolean);
  const newWords = newText.trim().split(/\s+/).filter(Boolean);
  if (oldWords.length === 0 && newWords.length === 0) return 100;

  const maxLen = Math.max(oldWords.length, newWords.length);
  const { added, removed } = countWordChanges(oldText, newText);
  const mutations = (added + removed) / 2;
  const similarity = Math.max(0, Math.min(100, Math.round(((maxLen - mutations) / maxLen) * 100)));
  return similarity;
}
