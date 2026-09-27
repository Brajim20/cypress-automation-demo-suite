import {
  filterTodos,
  isTodo,
  isTodoListPayload,
  itemsLeftLabel,
  parseFilter,
  validateTitle,
} from './todo-logic.js';

const token = localStorage.getItem('todo.token');
if (!token) location.replace('/login');

const $ = (cy) => document.querySelector(`[data-cy="${cy}"]`);
const el = {
  user: $('current-user'),
  logout: $('logout'),
  banner: $('error-banner'),
  bannerMessage: $('error-message'),
  retry: $('retry'),
  form: $('new-todo-form'),
  input: $('new-todo'),
  inputError: $('new-todo-error'),
  loading: $('loading'),
  empty: $('empty-state'),
  main: $('main'),
  toggleAll: $('toggle-all'),
  list: $('todo-list'),
  footer: $('footer'),
  count: $('todo-count'),
  clearCompleted: $('clear-completed'),
};

const state = {
  status: 'loading', // loading | ready | error
  todos: [],
  filter: parseFilter(location.hash),
  editingId: null,
};

class ApiError extends Error {}

async function api(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server.');
  }
  if (res.status === 401) {
    localStorage.removeItem('todo.token');
    location.replace('/login?expired=1');
    throw new ApiError('Session expired.');
  }
  if (res.status === 204) return null;
  const payload = await res.json().catch(() => {
    throw new ApiError('The server sent a response this page could not read.');
  });
  if (!res.ok) throw new ApiError(payload?.error?.message ?? `Request failed (${res.status}).`);
  return payload;
}

function showBanner(message, { retry = false } = {}) {
  el.bannerMessage.textContent = message;
  el.retry.hidden = !retry;
  el.banner.hidden = false;
}

function hideBanner() {
  el.banner.hidden = true;
}

function renderItem(todo) {
  const li = document.createElement('li');
  li.dataset.cy = 'todo-item';
  li.dataset.id = String(todo.id);
  li.classList.toggle('completed', todo.completed);

  if (state.editingId === todo.id) {
    li.classList.add('editing');
    const edit = document.createElement('input');
    edit.className = 'edit';
    edit.dataset.cy = 'todo-edit';
    edit.value = todo.title;
    edit.setAttribute('aria-label', `Edit ${todo.title}`);
    let settled = false;
    const finish = (commit) => {
      if (settled) return;
      settled = true;
      if (commit) saveEdit(todo, edit.value);
      else {
        state.editingId = null;
        render();
      }
    };
    edit.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    edit.addEventListener('blur', () => finish(true));
    li.append(edit);
    queueMicrotask(() => {
      edit.focus();
      edit.setSelectionRange(edit.value.length, edit.value.length);
    });
    return li;
  }

  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.className = 'toggle';
  toggle.dataset.cy = 'todo-toggle';
  toggle.checked = todo.completed;
  toggle.setAttribute(
    'aria-label',
    `Mark ${todo.title} as ${todo.completed ? 'active' : 'complete'}`,
  );
  toggle.addEventListener('change', () => setCompleted(todo, toggle.checked));

  /* textContent, never innerHTML: a title is user input and must render as text. */
  const label = document.createElement('label');
  label.dataset.cy = 'todo-title';
  label.textContent = todo.title;
  label.addEventListener('dblclick', () => {
    state.editingId = todo.id;
    render();
  });

  const destroy = document.createElement('button');
  destroy.type = 'button';
  destroy.className = 'destroy';
  destroy.dataset.cy = 'todo-delete';
  destroy.setAttribute('aria-label', `Delete ${todo.title}`);
  destroy.addEventListener('click', () => removeTodo(todo));

  li.append(toggle, label, destroy);
  return li;
}

function render() {
  const { status, todos, filter } = state;
  el.loading.hidden = status !== 'loading';
  el.empty.hidden = !(status === 'ready' && todos.length === 0);
  el.main.hidden = todos.length === 0;
  el.footer.hidden = todos.length === 0;

  const visible = filterTodos(todos, filter);
  el.list.replaceChildren(...visible.map(renderItem));

  const active = todos.filter((t) => !t.completed).length;
  el.count.textContent = itemsLeftLabel(active);
  el.toggleAll.checked = todos.length > 0 && active === 0;
  el.clearCompleted.hidden = todos.length === active;

  for (const name of ['all', 'active', 'completed']) {
    const link = $(`filter-${name}`);
    link.classList.toggle('selected', filter === name);
    if (filter === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

async function load() {
  state.status = 'loading';
  hideBanner();
  render();
  try {
    const payload = await api('GET', '/api/todos');
    if (!isTodoListPayload(payload)) {
      throw new ApiError('The server sent a response this page could not read.');
    }
    state.todos = payload.todos;
    state.status = 'ready';
  } catch (err) {
    state.status = 'error';
    showBanner(`Couldn't load your todos. ${err.message}`, { retry: true });
  }
  render();
}

function setInputError(message) {
  el.inputError.textContent = message ?? '';
  el.inputError.hidden = !message;
  el.input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

async function addTodo() {
  const result = validateTitle(el.input.value);
  if (!result.ok) {
    /* Blank input is silently ignored, as in TodoMVC; anything else gets a message. */
    setInputError(result.code === 'title_required' ? null : result.message);
    return;
  }
  setInputError(null);
  /* Clear immediately so a fast typist's next todo does not append to this one while the
     request is in flight. A second Enter on the now-empty input is a no-op, which is also
     what stops a double-submit. */
  el.input.value = '';
  try {
    const todo = await api('POST', '/api/todos', { title: result.title });
    if (!isTodo(todo)) throw new ApiError('The server sent a response this page could not read.');
    state.todos.push(todo);
    /* Responses can land out of order; the server's id order is the source of truth. */
    state.todos.sort((a, b) => a.id - b.id);
    state.status = 'ready';
    hideBanner();
  } catch (err) {
    /* Put the text back so nothing the user wrote is lost, unless they've started another. */
    if (el.input.value === '') el.input.value = result.title;
    showBanner(`Couldn't save your todo. ${err.message}`);
  }
  render();
}

async function patchTodo(todo, patch, failureMessage) {
  try {
    const updated = await api('PATCH', `/api/todos/${todo.id}`, patch);
    Object.assign(todo, updated);
    hideBanner();
  } catch (err) {
    showBanner(`${failureMessage} ${err.message}`);
  }
}

async function setCompleted(todo, completed) {
  await patchTodo(todo, { completed }, "Couldn't update that todo.");
  render();
}

async function saveEdit(todo, rawTitle) {
  state.editingId = null;
  if (rawTitle.trim() === '') {
    await removeTodo(todo);
    return;
  }
  const result = validateTitle(rawTitle);
  if (!result.ok) {
    showBanner(result.message);
    render();
    return;
  }
  if (result.title !== todo.title) {
    await patchTodo(todo, { title: result.title }, "Couldn't rename that todo.");
  }
  render();
}

async function removeTodo(todo) {
  try {
    await api('DELETE', `/api/todos/${todo.id}`);
    state.todos = state.todos.filter((t) => t.id !== todo.id);
    hideBanner();
  } catch (err) {
    showBanner(`Couldn't delete that todo. ${err.message}`);
  }
  render();
}

el.form.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo();
});
el.input.addEventListener('input', () => setInputError(null));

el.toggleAll.addEventListener('change', async () => {
  const target = el.toggleAll.checked;
  await Promise.all(
    state.todos
      .filter((t) => t.completed !== target)
      .map((t) => patchTodo(t, { completed: target }, "Couldn't update every todo.")),
  );
  render();
});

el.clearCompleted.addEventListener('click', async () => {
  try {
    await api('POST', '/api/todos/clear-completed');
    state.todos = state.todos.filter((t) => !t.completed);
    hideBanner();
  } catch (err) {
    showBanner(`Couldn't clear completed todos. ${err.message}`);
  }
  render();
});

el.retry.addEventListener('click', load);

el.logout.addEventListener('click', async () => {
  await api('POST', '/api/logout').catch(() => {});
  localStorage.removeItem('todo.token');
  localStorage.removeItem('todo.email');
  location.assign('/login');
});

window.addEventListener('hashchange', () => {
  state.filter = parseFilter(location.hash);
  render();
});

el.user.textContent = localStorage.getItem('todo.email') ?? '';
if (token) load();
