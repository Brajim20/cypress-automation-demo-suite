# BUG-001 · Oversized request body drops the connection instead of returning 413

**Status**: ✅ Fixed, regression test in place (`TC-SEC-05`)
**Found**: 27 Sep 2026, by the automated suite on its first run
**Environment**: local app (`npm start`), Cypress 15.21.1, macOS
**Severity**: Medium. Clients get no response, not a wrong one. No data loss.
**Priority**: High. Cheap to fix, and it turns a clear client error into what looks like an outage.

---

## Actual behaviour

`POST /api/todos` with a body over the 10 KB limit got no HTTP response at all. The connection
was closed and the client reported:

```
Error: socket hang up
```

## Expected behaviour

`413 Payload Too Large` with the standard error envelope:

```json
{ "error": { "code": "payload_too_large", "message": "Request body is too large." } }
```

## Steps to reproduce

1. `npm start`
2. Get a token: `POST /api/login` with the demo account
3. `POST /api/todos` with header `Authorization: Bearer <token>` and body
   `{"title": "<20,000 x characters>"}`
4. Observe: connection reset, no status code

Or: `npm run test:security` (TC-SEC-05 failed before the fix).

## Root cause

`readJson` in `app/server.js` called `req.destroy()` as soon as the limit was crossed. That
tears down the socket before the handler gets a chance to write the 413:

```js
if (size > MAX_BODY_BYTES) {
  reject(/* 413 */);
  req.destroy(); // ❌ closes the socket, so the 413 is never sent
  return;
}
```

## Fix

Stop buffering but keep draining the request, then reject with the 413 on `end`, so the
response goes out on a live connection. See the comment at the fix site in `readJson`.

## How it was verified

- TC-SEC-05 failed against the original code (that's how the bug was found) and passes with
  the fix, so the test really covers this bug and isn't passing by accident.
- Full suite green on 4 consecutive runs after the fix.

## Why it matters beyond this app

A dropped connection looks to a client (and to monitoring) like the server is down. A 413
tells the caller exactly what they did wrong. Tests that only check the happy path would
never have sent a 20 KB body, which is the case for keeping a small security smoke tier.
