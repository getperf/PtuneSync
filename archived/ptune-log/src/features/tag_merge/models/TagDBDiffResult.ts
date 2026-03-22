export type TagDBDiffResult = {
  added: string[];
  removed: string[];
};

export function hasTagDBDiff(diff: TagDBDiffResult): boolean {
  return diff.added.length > 0 || diff.removed.length > 0;
}
