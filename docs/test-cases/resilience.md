# Test cases · Errors and network states (US-03)

These states can't be arranged against a healthy backend, so the automated versions stub the
network with `cy.intercept`. To run them by hand, use Chrome DevTools: **Network → throttling**
for slow and offline, and **Network → right-click a request → Block request URL** for failures.
Or use a proxy such as Charles or mitmproxy to rewrite responses.

---

### TC-NET-01 · Empty state

- **Priority** Medium · **Covers** AC-03.1 · **Automated** `integration/network-states.cy.ts`
- **Preconditions**: signed in; no todos
- **Expected**: "Nothing to do yet…" shown; no footer; no error.

### TC-NET-02 · Load failure, then Retry

- **Priority** High · **Covers** AC-03.2 · **Automated** `integration/network-states.cy.ts` · `@smoke`
- **Steps**: 1. Make `GET /api/todos` fail with a 500. 2. Load the page. 3. Restore the API. 4. Click Retry.
- **Expected**: 2. "Couldn't load your todos." with a Retry button; no rows. 4. the list loads;
  the error disappears.

### TC-NET-03 · Loading state

- **Priority** Low · **Covers** AC-03.3 · **Automated** `integration/network-states.cy.ts`
- **Steps**: load the page on a slow connection.
- **Expected**: "Loading your todos…" while waiting; replaced by the list once loaded.
- **Automation note**: the reply is held until the test releases it, instead of using a fixed
  delay, so the test can't race on a slow CI runner.

### TC-NET-04 · Malformed response

- **Priority** Medium · **Covers** AC-03.4 · **Automated** `integration/network-states.cy.ts`
- **Steps**: return `{"todos":[{"id":"101","name":"x","done":false}]}` (wrong types, wrong keys).
- **Expected**: an error saying the response couldn't be read; no rows rendered; nothing broken.

### TC-NET-05 · Save failure keeps the typed text

- **Priority** High · **Covers** AC-03.5 · **Automated** `integration/network-states.cy.ts`
- **Steps**: make `POST /api/todos` fail; add `Buy milk`.
- **Expected**: "Couldn't save your todo."; no row added; `Buy milk` is back in the input.

### TC-NET-06 · Request contract when adding

- **Priority** Medium · **Covers** AC-01.2, AC-02.1 · **Automated** `integration/network-states.cy.ts`
- **Steps**: add `  Buy milk  ` and inspect the request.
- **Expected**: body exactly `{"title":"Buy milk"}`; `Authorization: Bearer <48 hex chars>`;
  response `201`.

### TC-NET-07 · Expired session

- **Priority** High · **Covers** AC-03.7 · **Automated** `integration/network-states.cy.ts`
- **Steps**: make `GET /api/todos` return 401.
- **Expected**: redirected to `/login` with "Your session expired."

### TC-NET-08 · No connection

- **Priority** Medium · **Covers** AC-03.8 · **Automated** `integration/network-states.cy.ts`
- **Steps**: go offline (DevTools → Offline) and load the list.
- **Expected**: "Could not reach the server."

### TC-NET-09 · Failed update is not shown as done

- **Priority** High · **Covers** AC-03.6 · **Automated** `integration/network-states.cy.ts`
- **Steps**: make `PATCH /api/todos/*` fail; tick a todo.
- **Expected**: error shown; the todo is **not** struck through and its checkbox is unticked;
  counter unchanged.
