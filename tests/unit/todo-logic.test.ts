import { describe, expect, it } from 'vitest';
import {
  MAX_TITLE_LENGTH,
  filterTodos,
  isTodoListPayload,
  itemsLeftLabel,
  parseFilter,
  validateTitle,
} from '../../app/public/todo-logic.js';

/**
 * Unit tests for the app's own validation module, the same file the browser and the server
 * import. Fast, no browser, and each boundary is pinned here once instead of being rediscovered
 * through the UI.
 */
describe('validateTitle', () => {
  it('trims and accepts an ordinary title', () => {
    expect(validateTitle('  Buy milk  ')).toEqual({ ok: true, title: 'Buy milk' });
  });

  it.each([
    ['empty string', ''],
    ['spaces', '    '],
    ['tabs and newlines', '\t\n '],
  ])('rejects %s as required', (_name, input) => {
    expect(validateTitle(input)).toMatchObject({ ok: false, code: 'title_required' });
  });

  it.each([
    ['a number', 42],
    ['null', null],
    ['undefined', undefined],
    ['an object', { title: 'x' }],
  ])('rejects %s as invalid', (_name, input) => {
    expect(validateTitle(input)).toMatchObject({ ok: false, code: 'title_invalid' });
  });

  describe('length boundary', () => {
    it.each([
      ['exactly the limit', 'a'.repeat(MAX_TITLE_LENGTH), true],
      ['one over the limit', 'a'.repeat(MAX_TITLE_LENGTH + 1), false],
      ['the limit in emoji (2 UTF-16 units each)', '🙂'.repeat(MAX_TITLE_LENGTH), true],
      ['one emoji over', '🙂'.repeat(MAX_TITLE_LENGTH + 1), false],
      [
        'the limit plus surrounding whitespace, which is trimmed first',
        ` ${'a'.repeat(MAX_TITLE_LENGTH)} `,
        true,
      ],
    ])('%s', (_name, input, ok) => {
      expect(validateTitle(input).ok).toBe(ok);
    });
  });
});

describe('itemsLeftLabel', () => {
  it.each([
    [0, '0 items left'],
    [1, '1 item left'],
    [2, '2 items left'],
    [11, '11 items left'],
  ])('%i → %s', (count, label) => {
    expect(itemsLeftLabel(count)).toBe(label);
  });
});

describe('parseFilter', () => {
  it.each([
    ['#/active', 'active'],
    ['#/completed', 'completed'],
    ['#/', 'all'],
    ['', 'all'],
    ['#/ACTIVE', 'all'],
    ['#/unknown', 'all'],
    [undefined, 'all'],
  ])('%s → %s', (hash, filter) => {
    expect(parseFilter(hash)).toBe(filter);
  });
});

describe('filterTodos', () => {
  const todos = [
    { id: 1, title: 'a', completed: false },
    { id: 2, title: 'b', completed: true },
  ];

  it('splits by completion', () => {
    expect(filterTodos(todos, 'active').map((t) => t.id)).toEqual([1]);
    expect(filterTodos(todos, 'completed').map((t) => t.id)).toEqual([2]);
    expect(filterTodos(todos, 'all')).toBe(todos);
  });
});

describe('isTodoListPayload', () => {
  it('accepts a well-formed list, including an empty one', () => {
    expect(isTodoListPayload({ todos: [] })).toBe(true);
    expect(isTodoListPayload({ todos: [{ id: 1, title: 'a', completed: false }] })).toBe(true);
  });

  it.each([
    ['null', null],
    ['an array at the top level', []],
    ['todos not an array', { todos: 'nope' }],
    ['a string id', { todos: [{ id: '1', title: 'a', completed: false }] }],
    ['a missing title', { todos: [{ id: 1, completed: false }] }],
    ['a non-boolean completed', { todos: [{ id: 1, title: 'a', completed: 'no' }] }],
  ])('rejects %s', (_name, payload) => {
    expect(isTodoListPayload(payload)).toBe(false);
  });
});
