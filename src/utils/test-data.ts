export interface SeedTodo {
  title: string;
  completed?: boolean;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

/**
 * A title unique to this run, so a test can find "its" todo by text even if another test's
 * data is on screen.
 */
export function uniqueTitle(prefix = 'Todo'): string {
  return `${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** A mixed list: two active, one completed. The default fixture for filter and count tests. */
export const MIXED_TODOS: SeedTodo[] = [
  { title: 'Write test plan' },
  { title: 'Review pull request', completed: true },
  { title: 'Update regression suite' },
];
