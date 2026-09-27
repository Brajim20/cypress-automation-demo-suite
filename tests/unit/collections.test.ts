import { describe, expect, it } from 'vitest';
import { isPartition } from '../../src/utils/collections';

/**
 * isPartition backs the filter test in cypress/e2e/ui/todos.cy.ts. A guard is only worth
 * having if it can fail, so most of these cases are the failures it exists to catch.
 */
describe('isPartition', () => {
  const all = ['a', 'b', 'c'];

  it('passes for a clean split', () => {
    expect(isPartition(all, [['a', 'c'], ['b']])).toBe(true);
  });

  it('passes when one side is empty', () => {
    expect(isPartition(all, [all, []])).toBe(true);
  });

  it('fails when an item is in both parts', () => {
    expect(isPartition(all, [['a', 'b', 'c'], ['b']])).toBe(false);
  });

  it('fails when an item is in neither part', () => {
    expect(isPartition(all, [['a'], ['b']])).toBe(false);
  });

  it('fails when the counts add up but the members are wrong', () => {
    /* The case a count-only assertion cannot see: 2 + 1 = 3, matching the total, but "b" is
       duplicated and "c" is missing. */
    expect(isPartition(all, [['a', 'b'], ['b']])).toBe(false);
  });

  it('fails when a part contains something not in the whole', () => {
    expect(isPartition(all, [['a', 'b', 'c'], ['x']])).toBe(false);
  });
});
