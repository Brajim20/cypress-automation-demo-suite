/**
 * Checks that `parts` split `whole` exactly: every element of `whole` appears in exactly one
 * part, and no part contains anything that is not in `whole`.
 *
 * Used by the filter tests. "Active shows 2 and Completed shows 1" can pass while the same item
 * sits in both lists and another is in neither; a partition check cannot.
 *
 * Items are compared by value, so they must be unique within `whole` (titles are, in the
 * fixtures this is used with).
 */
export function isPartition<T>(whole: readonly T[], parts: readonly (readonly T[])[]): boolean {
  const counts = new Map<T, number>();
  for (const part of parts) {
    for (const item of part) counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  if (counts.size !== new Set(whole).size) return false;
  return whole.every((item) => counts.get(item) === 1);
}
