# US-03 · Tell me when something goes wrong, and never lose my work

**As a** user on an unreliable connection
**I want** the app to tell me clearly when it can't load or save
**So that** I never think something was saved when it wasn't, and never lose what I typed

**Priority**: Should have · **Risk**: Medium (trust; silent data loss)

## Acceptance criteria

| ID      | Given                                    | When                        | Then                                                                                   |
| ------- | ---------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------- |
| AC-03.1 | I have no todos                          | the list loads              | I see a friendly empty state, not an empty box                                         |
| AC-03.2 | the server fails                         | the list loads              | I see an error that says the list couldn't load, and a Retry button that works         |
| AC-03.3 | the server is slow                       | the list is loading         | I see a loading message until it arrives                                               |
| AC-03.4 | the server sends data in the wrong shape | the list loads              | the page shows an error rather than blank or broken rows                               |
| AC-03.5 | the server fails                         | I add a todo                | I see an error, the todo is not shown as added, and my typed text is back in the input |
| AC-03.6 | the server fails                         | I tick a todo               | I see an error and the todo is **not** shown as completed                              |
| AC-03.7 | my session has expired                   | the app talks to the server | I am sent to sign in, with a message saying my session expired                         |
| AC-03.8 | I have no connection                     | the list loads              | I am told the server couldn't be reached                                               |

## Notes

- These states can't be produced on demand against a working backend, so they are tested by
  stubbing the network with `cy.intercept` (see `cypress/e2e/integration/`). That is the
  integration layer's reason to exist.
- AC-03.6 rules out optimistic updates that are not rolled back. It was chosen deliberately:
  a checkbox that shows done when the server said no is the silent-data-loss case this
  story exists to prevent.
