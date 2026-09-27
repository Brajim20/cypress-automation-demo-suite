/**
 * The application under test: a small TodoMVC-style app with a real REST API and sign-in.
 *
 * Zero dependencies on purpose. It exists so the merge gate runs against something local and
 * deterministic: a red build means this repo broke, never that a third-party site fell over.
 *
 * State is in memory. `POST /api/test/reset` wipes and optionally seeds it; that route is
 * disabled when NODE_ENV=production.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateTitle } from './public/todo-logic.js';

const PORT = Number(process.env.PORT ?? 4173);
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const TEST_HOOKS = process.env.NODE_ENV !== 'production';
const MAX_BODY_BYTES = 10_000;

/* Demo accounts. Not secrets: this app only ever runs on localhost or a CI runner. */
const USERS = [
  { id: 1, email: 'qa@example.com', password: 'correct-horse-battery' },
  { id: 2, email: 'other@example.com', password: 'correct-horse-battery' },
];

/** token -> userId */
const sessions = new Map();
/** userId -> todo[] */
let todosByUser = new Map();
let nextId = 1;

function resetStore(seed = {}) {
  todosByUser = new Map(USERS.map((u) => [u.id, []]));
  nextId = 1;
  for (const [email, todos] of Object.entries(seed)) {
    const user = USERS.find((u) => u.email === email);
    if (!user) continue;
    for (const t of todos) {
      todosByUser.get(user.id).push({ id: nextId++, title: t.title, completed: !!t.completed });
    }
  }
}
resetStore();

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function send(res, status, body) {
  const headers = { ...SECURITY_HEADERS, 'Cache-Control': 'no-store' };
  if (body === undefined) {
    res.writeHead(status, headers).end();
    return;
  }
  headers['Content-Type'] = 'application/json; charset=utf-8';
  res.writeHead(status, headers).end(JSON.stringify(body));
}

function sendError(res, status, code, message) {
  send(res, status, { error: { code, message } });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        /* Stop buffering but keep draining. Destroying the socket here (the original code)
           dropped the connection before the 413 could be written, so clients saw "socket hang
           up" instead of an answer. Caught by TC-SEC-05. */
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(
          Object.assign(new Error('Request body is too large.'), {
            status: 413,
            code: 'payload_too_large',
          }),
        );
        return;
      }
      const text = Buffer.concat(chunks).toString('utf8');
      if (text.length === 0) return resolve({});
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('not an object');
        }
        resolve(parsed);
      } catch {
        reject(
          Object.assign(new Error('Request body must be a JSON object.'), {
            status: 400,
            code: 'invalid_json',
          }),
        );
      }
    });
    req.on('error', reject);
  });
}

function authenticate(req) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '');
  if (!match) return null;
  const userId = sessions.get(match[1]);
  return userId ? USERS.find((u) => u.id === userId) : null;
}

const publicUser = (u) => ({ id: u.id, email: u.email });

async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method;

  if (method === 'POST' && pathname === '/api/login') {
    const body = await readJson(req);
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return sendError(res, 400, 'credentials_required', 'Email and password are required.');
    }
    const user = USERS.find(
      (u) => u.email === body.email.trim().toLowerCase() && u.password === body.password,
    );
    /* One message for unknown email and wrong password alike, so the endpoint cannot be used
       to discover which addresses have accounts. */
    if (!user) return sendError(res, 401, 'invalid_credentials', 'Email or password is incorrect.');
    const token = randomBytes(24).toString('hex');
    sessions.set(token, user.id);
    return send(res, 200, { token, user: publicUser(user) });
  }

  if (TEST_HOOKS && method === 'POST' && pathname === '/api/test/reset') {
    const body = await readJson(req);
    resetStore(body.seed ?? {});
    return send(res, 204);
  }

  const user = authenticate(req);
  if (!user) return sendError(res, 401, 'unauthenticated', 'Sign in to continue.');
  const todos = todosByUser.get(user.id);

  if (method === 'GET' && pathname === '/api/me') {
    return send(res, 200, { user: publicUser(user) });
  }

  if (method === 'POST' && pathname === '/api/logout') {
    sessions.delete(req.headers.authorization.slice('Bearer '.length));
    return send(res, 204);
  }

  if (pathname === '/api/todos') {
    if (method === 'GET') return send(res, 200, { todos });
    if (method === 'POST') {
      const body = await readJson(req);
      const result = validateTitle(body.title);
      if (!result.ok) return sendError(res, 400, result.code, result.message);
      const todo = { id: nextId++, title: result.title, completed: false };
      todos.push(todo);
      return send(res, 201, todo);
    }
    return sendError(res, 405, 'method_not_allowed', `${method} is not supported here.`);
  }

  if (method === 'POST' && pathname === '/api/todos/clear-completed') {
    const remaining = todos.filter((t) => !t.completed);
    const deleted = todos.length - remaining.length;
    todosByUser.set(user.id, remaining);
    return send(res, 200, { deleted });
  }

  const idMatch = /^\/api\/todos\/(\d+)$/.exec(pathname);
  if (idMatch) {
    const id = Number(idMatch[1]);
    /* Another user's todo is reported as 404, not 403: a 403 would confirm the id exists. */
    const todo = todos.find((t) => t.id === id);
    if (!todo) return sendError(res, 404, 'not_found', `Todo ${id} not found.`);

    if (method === 'PATCH') {
      const body = await readJson(req);
      const patch = {};
      if ('title' in body) {
        const result = validateTitle(body.title);
        if (!result.ok) return sendError(res, 400, result.code, result.message);
        patch.title = result.title;
      }
      if ('completed' in body) {
        if (typeof body.completed !== 'boolean') {
          return sendError(res, 400, 'completed_invalid', 'completed must be true or false.');
        }
        patch.completed = body.completed;
      }
      Object.assign(todo, patch);
      return send(res, 200, todo);
    }
    if (method === 'DELETE') {
      todosByUser.set(
        user.id,
        todos.filter((t) => t.id !== id),
      );
      return send(res, 204);
    }
    return sendError(res, 405, 'method_not_allowed', `${method} is not supported here.`);
  }

  return sendError(res, 404, 'not_found', 'No such endpoint.');
}

async function serveStatic(res, pathname) {
  const routes = { '/': 'index.html', '/login': 'login.html' };
  const file = routes[pathname] ?? pathname.slice(1);
  const resolved = normalize(join(PUBLIC_DIR, file));
  if (!resolved.startsWith(PUBLIC_DIR) || !MIME[extname(resolved)]) {
    return sendError(res, 404, 'not_found', 'Not found.');
  }
  try {
    const content = await readFile(resolved);
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': MIME[extname(resolved)] });
    res.end(content);
  } catch {
    sendError(res, 404, 'not_found', 'Not found.');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  try {
    if (url.pathname === '/healthz') return send(res, 200, { ok: true });
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET') return sendError(res, 405, 'method_not_allowed', 'GET only.');
    return await serveStatic(res, url.pathname);
  } catch (err) {
    if (err.status) return sendError(res, err.status, err.code, err.message);
    console.error(err);
    return sendError(res, 500, 'internal', 'Something went wrong.');
  }
});

server.listen(PORT, () => {
  console.log(
    `App under test on http://localhost:${PORT} (test hooks ${TEST_HOOKS ? 'on' : 'off'})`,
  );
});
