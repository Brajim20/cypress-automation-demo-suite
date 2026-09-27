# US-02 · Sign in and keep my list private

**As a** user
**I want to** sign in to see my own todos, and only mine
**So that** my list is private to me

**Priority**: Must have · **Risk**: High (privacy and security)

## Acceptance criteria

| ID      | Given                    | When                                              | Then                                                                                  |
| ------- | ------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| AC-02.1 | I have an account        | I sign in with the right email and password       | I land on my todo list and see which account I am signed in as                        |
| AC-02.2 | I am on the sign-in page | I enter a wrong password                          | I see "Email or password is incorrect." and stay on the sign-in page                  |
| AC-02.3 | I am on the sign-in page | I enter an email with no account                  | I see exactly the same message as for a wrong password                                |
| AC-02.4 | I am on the sign-in page | I submit with a field empty                       | I am told to fill both fields, without a request being sent                           |
| AC-02.5 | I am not signed in       | I open the todo list URL                          | I am sent to the sign-in page                                                         |
| AC-02.6 | I am signed in           | I sign out                                        | I return to the sign-in page, and my old session can no longer be used                |
| AC-02.7 | another user has todos   | I use the app or call the API with my own session | I can't see, change or delete their todos, and I can't tell whether a given id exists |

## Notes

- AC-02.3 exists because a different message for "no such account" lets anyone test which
  email addresses are registered. Raised by QA in refinement, not in the original story.
- AC-02.7 is mostly an API-level criterion: the UI never shows another user's todos, so the
  risk is someone calling the API directly with a guessed id.
