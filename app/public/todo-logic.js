/**
 * Pure logic shared by the browser client, the API server and the unit tests.
 *
 * Keeping validation in one module means the client and server cannot drift apart on what a
 * valid title is, and the rule gets unit-tested once, without a browser.
 */

/** @typedef {{ id: number, title: string, completed: boolean }} Todo */

export const MAX_TITLE_LENGTH = 200;

export const FILTERS = ['all', 'active', 'completed'];

/**
 * Length in user-perceived code points, not UTF-16 units, so "🙂" counts as 1 and not 2.
 * `String.prototype.length` would let a title of 101 emoji through a 200 limit check on one
 * side and reject it on the other.
 *
 * @param {string} title
 */
export function titleLength(title) {
  return [...title].length;
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, title: string } | { ok: false, code: string, message: string }}
 */
export function validateTitle(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, code: 'title_invalid', message: 'Title must be a string.' };
  }
  const title = raw.trim();
  if (title.length === 0) {
    return { ok: false, code: 'title_required', message: 'Title is required.' };
  }
  if (titleLength(title) > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      code: 'title_too_long',
      message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, title };
}

/** @param {number} count */
export function itemsLeftLabel(count) {
  return `${count} ${count === 1 ? 'item' : 'items'} left`;
}

/**
 * @param {string | undefined} hash
 * @returns {'all' | 'active' | 'completed'}
 */
export function parseFilter(hash) {
  const name = String(hash ?? '').replace(/^#\/?/, '');
  return FILTERS.includes(name) ? /** @type {'all' | 'active' | 'completed'} */ (name) : 'all';
}

/**
 * @param {Todo[]} todos
 * @param {string} filter
 * @returns {Todo[]}
 */
export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((t) => !t.completed);
  if (filter === 'completed') return todos.filter((t) => t.completed);
  return todos;
}

/**
 * Shape check for a todo coming off the wire. The client refuses to render anything else.
 *
 * @param {any} value
 * @returns {value is Todo}
 */
export function isTodo(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Number.isInteger(value.id) &&
    typeof value.title === 'string' &&
    typeof value.completed === 'boolean'
  );
}

/**
 * @param {any} payload
 * @returns {payload is { todos: Todo[] }}
 */
export function isTodoListPayload(payload) {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray(payload.todos) &&
    payload.todos.every(isTodo)
  );
}
