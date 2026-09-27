import { todoPage } from '../../support/pages/todo.page';
import { isPartition } from '../../../src/utils/collections';
import { MIXED_TODOS } from '../../../src/utils/test-data';

/**
 * Todo list behaviour against the real local backend: nothing stubbed, so these also prove
 * the UI and the API agree (a reload re-reads from the server).
 *
 * Preconditions are arranged through the API (cy.resetApp with a seed) rather than by
 * clicking, so each test only drives the UI for the behaviour it is actually testing.
 */
describe('Todo list', { tags: '@regression' }, () => {
  const email = Cypress.expose('userEmail') as string;

  const seedAndVisit = (todos = MIXED_TODOS) => {
    cy.resetApp({ [email]: todos });
    cy.login();
    todoPage.visit();
  };

  describe('adding', () => {
    beforeEach(() => seedAndVisit([]));

    it('TC-TODO-01 adds todos in the order they were entered', { tags: '@smoke' }, () => {
      todoPage.addTodo('Write test plan');
      todoPage.addTodo('Review pull request');

      todoPage.items().should('have.length', 2);
      todoPage.visibleTitles().should('deep.equal', ['Write test plan', 'Review pull request']);
      todoPage.newTodoInput().should('have.value', '');
    });

    it('TC-TODO-02 trims surrounding whitespace from the title', () => {
      todoPage.addTodo('   Buy milk   ');
      todoPage.titles().should('have.length', 1).and('have.text', 'Buy milk');
    });

    it('TC-TODO-03 ignores a blank or whitespace-only title', () => {
      todoPage.newTodoInput().type('{enter}');
      todoPage.newTodoInput().type('     {enter}');

      todoPage.items().should('not.exist');
      todoPage.emptyState().should('be.visible');
      /* Blank is ignored silently, as in TodoMVC; it is not an error state. */
      todoPage.inputError().should('not.be.visible');
    });

    it('TC-TODO-04 accepts 200 characters and rejects 201 with a message', () => {
      const atLimit = 'a'.repeat(200);
      todoPage.newTodoInput().type(`${atLimit}{enter}`, { delay: 0 });
      todoPage.titles().should('have.length', 1).and('have.text', atLimit);

      todoPage.newTodoInput().type(`${atLimit}b{enter}`, { delay: 0 });
      todoPage.inputError().should('be.visible').and('contain', '200 characters or fewer');
      todoPage.newTodoInput().should('have.attr', 'aria-invalid', 'true');
      todoPage.items().should('have.length', 1);
    });
  });

  describe('counting and completing', () => {
    beforeEach(() => seedAndVisit());

    it('TC-TODO-05 pluralises the items-left counter correctly', () => {
      todoPage.count().should('have.text', '2 items left');
      todoPage.toggle('Write test plan');
      todoPage.count().should('have.text', '1 item left');
      todoPage.toggle('Update regression suite');
      todoPage.count().should('have.text', '0 items left');
    });

    it(
      'TC-TODO-06 marks a todo complete, and it stays complete after a reload',
      { tags: '@smoke' },
      () => {
        todoPage.toggle('Write test plan');
        todoPage.item('Write test plan').should('have.class', 'completed');

        cy.reload();
        todoPage.item('Write test plan').should('have.class', 'completed');
        todoPage.count().should('have.text', '1 item left');
      },
    );

    it('TC-TODO-07 toggle-all completes everything, and a second click reverts it', () => {
      todoPage.toggleAll().check();
      todoPage
        .items()
        .should('have.length', 3)
        .each(($li) => expect($li).to.have.class('completed'));
      todoPage.count().should('have.text', '0 items left');

      todoPage.toggleAll().uncheck();
      todoPage.items().filter('.completed').should('have.length', 0);
      todoPage.count().should('have.text', '3 items left');
    });
  });

  describe('filtering', () => {
    beforeEach(() => seedAndVisit());

    it(
      'TC-TODO-08 Active and Completed split All exactly, with nothing lost or duplicated',
      { tags: '@smoke' },
      () => {
        /* Counting each view is not enough: "2 active, 1 completed" also holds when one item is
         in both lists and another is in neither. The partition check catches that, and its own
         failure cases are unit-tested in tests/unit/collections.test.ts. */
        todoPage.items().should('have.length', 3);
        todoPage.visibleTitles().then((all) => {
          todoPage.filterBy('active');
          todoPage.items().should('have.length', 2);
          todoPage.visibleTitles().then((active) => {
            todoPage.filterBy('completed');
            todoPage.items().should('have.length', 1);
            todoPage.visibleTitles().then((completed) => {
              expect(isPartition(all, [active, completed]), 'active + completed partition all').to
                .be.true;
            });
          });
        });
      },
    );

    it('TC-TODO-09 keeps the chosen filter across a reload and marks it as current', () => {
      todoPage.filterBy('completed');
      cy.location('hash').should('eq', '#/completed');

      cy.reload();
      todoPage.visibleTitles().should('deep.equal', ['Review pull request']);
      todoPage.filterLink('completed').should('have.attr', 'aria-current', 'page');
      todoPage.filterLink('all').should('not.have.attr', 'aria-current');
    });
  });

  describe('editing and removing', () => {
    beforeEach(() => seedAndVisit());

    it('TC-TODO-10 renames a todo on Enter, and the rename is saved', () => {
      todoPage.startEditing('Write test plan').clear().type('Write the test plan{enter}');

      todoPage.item('Write the test plan').should('exist');
      cy.reload();
      todoPage.item('Write the test plan').should('exist');
      todoPage.titles().should('not.contain', 'Write test plan');
    });

    it('TC-TODO-11 discards an edit on Escape', () => {
      todoPage.startEditing('Write test plan').clear().type('Something else{esc}');

      todoPage.item('Write test plan').should('exist');
      cy.getByCy('todo-edit').should('not.exist');
    });

    it('TC-TODO-12 deletes a todo whose title is cleared during an edit', () => {
      todoPage.startEditing('Write test plan').clear().type('{enter}');

      todoPage.items().should('have.length', 2);
      todoPage.titles().should('not.contain', 'Write test plan');
    });

    it('TC-TODO-13 deletes a todo with its delete button', () => {
      todoPage.remove('Update regression suite');

      todoPage.items().should('have.length', 2);
      cy.reload();
      todoPage.items().should('have.length', 2);
      todoPage.titles().should('not.contain', 'Update regression suite');
    });

    it('TC-TODO-14 clears only completed todos, then hides the button', () => {
      todoPage.clearCompletedButton().should('be.visible').click();

      todoPage.visibleTitles().should('deep.equal', ['Write test plan', 'Update regression suite']);
      todoPage.clearCompletedButton().should('not.be.visible');
    });
  });
});
