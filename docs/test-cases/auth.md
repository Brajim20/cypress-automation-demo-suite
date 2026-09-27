# Test cases · Sign in and privacy (US-02)

Demo accounts: `qa@example.com` and `other@example.com`. The password is in the app's source
(`app/server.js`); it isn't repeated in docs.

---

### TC-AUTH-01 · Sign in with valid credentials

- **Priority** High · **Covers** AC-02.1 · **Automated** `ui/login.cy.ts` · `@smoke`
- **Preconditions**: signed out
- **Steps**: 1. Open `/login`. 2. Enter the demo email and password. 3. Click Sign in.
- **Expected**: lands on `/`; header shows `Signed in as qa@example.com`.

### TC-AUTH-02 · Wrong password

- **Priority** High · **Covers** AC-02.2 · **Automated** `ui/login.cy.ts`
- **Steps**: sign in with the right email and a wrong password.
- **Expected**: "Email or password is incorrect."; still on `/login`; no session stored.

### TC-AUTH-03 · Unknown email gets the same message

- **Priority** High · **Covers** AC-02.3 · **Automated** `ui/login.cy.ts`, and TC-SEC-03 at the API level
- **Steps**: sign in as `nobody@example.com` with any password.
- **Expected**: the **identical** message to TC-AUTH-02. At API level, the identical status
  and body.

### TC-AUTH-04 · Empty form is validated without a request

- **Priority** Medium · **Covers** AC-02.4 · **Automated** `ui/login.cy.ts`
- **Steps**: click Sign in with both fields empty.
- **Expected**: "Enter your email and password."; no request to `/api/login` is made
  (manually: check the Network tab).

### TC-AUTH-05 · Signed-out visitors are redirected

- **Priority** High · **Covers** AC-02.5 · **Automated** `ui/login.cy.ts`
- **Steps**: signed out, open `/`.
- **Expected**: sent to `/login`.

### TC-AUTH-06 · Sign out revokes the session

- **Priority** High · **Covers** AC-02.6 · **Automated** `ui/login.cy.ts`, and TC-SEC-04 at API level
- **Steps**: 1. Sign in. 2. Copy the token from localStorage (DevTools → Application). 3. Sign
  out. 4. Call `GET /api/me` with the copied token.
- **Expected**: back on `/login`; the old token gets `401`.

### TC-API-10 · One user can't touch another's todos

- **Priority** High · **Covers** AC-02.7 · **Automated** `api/todos-api.cy.ts` · `@smoke`
- **Steps**: 1. As `qa@`, create a todo and note its id. 2. As `other@`, list todos, then PATCH
  and DELETE that id.
- **Expected**: not in `other@`'s list; PATCH and DELETE return `404` (not `403`, which would
  confirm the id exists); `qa@`'s todo is unchanged.
- **Design note**: this is an IDOR check (insecure direct object reference), the most common
  real-world API authorization bug. The UI never shows another user's data, so only an
  API-level test can catch it.
