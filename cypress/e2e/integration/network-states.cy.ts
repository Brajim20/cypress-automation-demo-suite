import { todoPage } from '../../support/pages/todo.page';

/**
 * UI and API wired together, with the network stubbed by cy.intercept.
 *
 * The real backend only ever answers "200, well-formed". These specs force the states it
 * never produces on demand (a 500, a slow reply, a malformed payload, an expired session, a
 * dropped connection) and assert what the user actually sees. They also check the request
 * contract going the other way: what the client sends.
 */
describe('Network states', { tags: '@regression' }, () => {
  beforeEach(() => {
    cy.resetApp();
    cy.login();
  });

  it('TC-NET-01 shows the empty state when there are no todos', () => {
    cy.intercept('GET', '/api/todos', { body: { todos: [] } }).as('list');
    todoPage.visit();
    cy.wait('@list');

    todoPage.emptyState().should('be.visible');
    todoPage.footer().should('not.be.visible');
    todoPage.errorBanner().should('not.be.visible');
  });

  it(
    'TC-NET-02 shows an error with Retry when loading fails, and Retry recovers',
    { tags: '@smoke' },
    () => {
      /* times: 1 means only the first request fails; the retry reaches the fixture. */
      cy.intercept(
        { method: 'GET', url: '/api/todos', times: 1 },
        { statusCode: 500, body: {} },
      ).as('failed');
      todoPage.visit();
      cy.wait('@failed');

      todoPage.errorBanner().should('be.visible').and('contain', "Couldn't load your todos");
      todoPage.items().should('not.exist');

      cy.intercept('GET', '/api/todos', { fixture: 'todos-mixed.json' }).as('recovered');
      todoPage.retryButton().click();
      cy.wait('@recovered');

      todoPage.errorBanner().should('not.be.visible');
      todoPage.items().should('have.length', 3);
    },
  );

  it('TC-NET-03 shows a loading state while the list is in flight', () => {
    /* The reply is held until the test releases it. That's deterministic: a fixed
       { delay: 1000 } would race the assertion on a slow CI runner. */
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    cy.intercept('GET', '/api/todos', (req) =>
      gate.then(() => req.reply({ fixture: 'todos-mixed.json' })),
    ).as('list');

    todoPage.visit();
    todoPage.loading().should('be.visible');
    todoPage.items().should('not.exist');

    cy.then(() => release());
    cy.wait('@list');
    todoPage.loading().should('not.be.visible');
    todoPage.items().should('have.length', 3);
  });

  it('TC-NET-04 refuses to render a malformed payload and says so', () => {
    /* ids as strings, "name" instead of "title": the shape a half-finished backend change
       produces. The page must not render garbage rows or throw. */
    cy.intercept('GET', '/api/todos', { fixture: 'todos-malformed.json' }).as('list');
    todoPage.visit();
    cy.wait('@list');

    todoPage.errorBanner().should('be.visible').and('contain', 'could not read');
    todoPage.items().should('not.exist');
  });

  it('TC-NET-05 keeps the typed text and shows an error when saving fails', () => {
    cy.intercept('GET', '/api/todos', { body: { todos: [] } });
    cy.intercept('POST', '/api/todos', {
      statusCode: 500,
      body: { error: { code: 'internal', message: 'Something went wrong.' } },
    }).as('create');
    todoPage.visit();

    todoPage.addTodo('Buy milk');
    cy.wait('@create');

    todoPage.errorBanner().should('be.visible').and('contain', "Couldn't save your todo");
    todoPage.items().should('not.exist');
    todoPage.newTodoInput().should('have.value', 'Buy milk');
  });

  it('TC-NET-06 sends a trimmed title and a bearer token when adding', () => {
    cy.intercept('GET', '/api/todos', { body: { todos: [] } });
    cy.intercept('POST', '/api/todos').as('create');
    todoPage.visit();

    todoPage.addTodo('  Buy milk  ');

    cy.wait('@create').then(({ request, response }) => {
      expect(request.body).to.deep.equal({ title: 'Buy milk' });
      expect(request.headers.authorization).to.match(/^Bearer [0-9a-f]{48}$/);
      expect(response?.statusCode).to.eq(201);
    });
  });

  it('TC-NET-07 sends the user back to sign in when the session has expired', () => {
    cy.intercept('GET', '/api/todos', {
      statusCode: 401,
      body: { error: { code: 'unauthenticated', message: 'Sign in to continue.' } },
    }).as('list');
    todoPage.visit();
    cy.wait('@list');

    cy.location('pathname').should('eq', '/login');
    cy.getByCy('session-expired').should('be.visible');
  });

  it('TC-NET-08 explains a dropped connection instead of failing silently', () => {
    cy.intercept('GET', '/api/todos', { forceNetworkError: true }).as('list');
    todoPage.visit();
    cy.wait('@list');

    todoPage.errorBanner().should('be.visible').and('contain', 'Could not reach the server');
  });

  it('TC-NET-09 does not show a todo as complete when the update fails', () => {
    cy.intercept('GET', '/api/todos', { fixture: 'todos-mixed.json' });
    cy.intercept('PATCH', '/api/todos/*', {
      statusCode: 500,
      body: { error: { code: 'internal', message: 'Something went wrong.' } },
    }).as('update');
    todoPage.visit();

    todoPage.toggle('Write test plan');
    cy.wait('@update');

    /* The UI must not claim a change the server rejected. */
    todoPage.errorBanner().should('be.visible').and('contain', "Couldn't update that todo");
    todoPage.item('Write test plan').should('not.have.class', 'completed');
    todoPage.item('Write test plan').find('[data-cy="todo-toggle"]').should('not.be.checked');
    todoPage.count().should('have.text', '2 items left');
  });
});
