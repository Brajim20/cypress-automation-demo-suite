# US-01 · Manage my todo list

**As a** signed-in user
**I want to** add, complete, rename, filter and remove todos
**So that** I can keep track of what I still have to do

**Priority**: Must have · **Risk**: High (core value of the product)

## Acceptance criteria

| ID       | Given                                | When                                               | Then                                                                                |
| -------- | ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| AC-01.1  | I am on my list                      | I type a title and press Enter                     | the todo is added at the bottom of the list and the input is cleared                |
| AC-01.2  | I am adding a todo                   | the title has leading or trailing spaces           | the spaces are removed before saving                                                |
| AC-01.3  | I am adding a todo                   | the title is empty or only spaces                  | nothing is added and no error is shown                                              |
| AC-01.4  | I am adding a todo                   | the title is longer than 200 characters            | it is not added and I see why; 200 characters exactly is accepted                   |
| AC-01.5  | I have todos                         | I look at the footer                               | I see how many are left, with correct pluralisation ("1 item left", "2 items left") |
| AC-01.6  | I have an active todo                | I tick it                                          | it shows as completed, the counter drops by one, and this survives a reload         |
| AC-01.7  | I have several todos                 | I use "Mark all as complete"                       | all are completed; using it again makes them all active                             |
| AC-01.8  | I have active and completed todos    | I switch between All, Active and Completed         | each todo appears in exactly one of Active or Completed, and All shows every todo   |
| AC-01.9  | I chose a filter                     | I reload the page                                  | the same filter is still applied and is marked as the current one                   |
| AC-01.10 | I double-click a todo                | I change the title and press Enter (or click away) | the new title is saved                                                              |
| AC-01.11 | I am editing a todo                  | I press Escape                                     | the edit is discarded and the original title stays                                  |
| AC-01.12 | I am editing a todo                  | I clear the title and press Enter                  | the todo is deleted                                                                 |
| AC-01.13 | I have a todo                        | I press its delete button                          | it is removed, and stays removed after a reload                                     |
| AC-01.14 | I have completed todos               | I press "Clear completed"                          | only completed todos are removed, and the button disappears                         |
| AC-01.15 | a todo title contains HTML or script | it is displayed                                    | it shows as literal text and nothing executes                                       |

## Questions raised in refinement

These are the questions QA brought to refinement. Each answer became an acceptance criterion
above or a note here. Asking before build is cheaper than filing a bug after.

- _Is a blank title an error or a no-op?_ No-op, matching TodoMVC convention (AC-01.3).
- _200 characters of what?_ Characters as a user counts them, so an emoji is 1, not 2
  (AC-01.4, pinned by TC-API-05 and the unit tests).
- _What happens if saving fails?_ Split into US-03.
- _Should the filter be in the URL?_ Yes, so it is shareable and survives a reload (AC-01.9).
