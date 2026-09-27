import type { SeedTodo } from '../../src/utils/test-data';

/**
 * Custom commands: the cross-cutting actions every spec needs. Page-specific interaction lives
 * in the page objects under ./pages instead.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** `cy.get('[data-cy="name"]')`: the one selector strategy this suite uses. */
      getByCy(
        name: string,
        options?: Partial<Loggable & Timeoutable>,
      ): Chainable<JQuery<HTMLElement>>;

      /** Wipe server state and optionally seed todos, keyed by account email. */
      resetApp(seed?: Record<string, SeedTodo[]>): Chainable<void>;

      /** Sign in through the API and cache the session with cy.session(). */
      login(email?: string): Chainable<void>;

      /** Sign in through the API and yield the bearer token, for API-level specs. */
      apiToken(email?: string): Chainable<string>;

      /** axe-core scan against WCAG 2.1 A/AA, failing on any violation. */
      a11yScan(context?: string): Chainable<void>;
    }
  }
}

/* A query, not a command. Since Cypress 12, a Commands.add() wrapper around cy.get() is a
   command, and commands are not retried, so `cy.getByCy('x').should(...)` would assert
   against one stale lookup. A query re-runs until its assertion passes, like cy.get itself. */
Cypress.Commands.addQuery('getByCy', function (name, options = {}) {
  const getFn = cy.now('get', `[data-cy="${name}"]`, options) as (subject: unknown) => unknown;
  return (subject) => getFn(subject);
});

Cypress.Commands.add('resetApp', (seed = {}) => {
  cy.request('POST', '/api/test/reset', { seed });
});

Cypress.Commands.add('apiToken', (email = Cypress.expose('userEmail')) => {
  return cy
    .env<{ USER_PASSWORD: string }>(['USER_PASSWORD'])
    .then(({ USER_PASSWORD }) =>
      cy.request({
        method: 'POST',
        url: '/api/login',
        body: { email, password: USER_PASSWORD },
        log: false,
      }),
    )
    .its('body.token');
});

Cypress.Commands.add('login', (email = Cypress.expose('userEmail')) => {
  /* The UI sign-in flow is covered once, in ui/login.cy.ts. Everywhere else signs in through
     the API: faster, and a broken login form then fails one spec instead of all of them.
     cy.session caches the resulting localStorage across tests and specs, and `validate` throws
     the cache away if the server no longer accepts the token (e.g. after a restart). */
  cy.session(
    ['api-login', email],
    () => {
      cy.apiToken(email).then((token) => {
        window.localStorage.setItem('todo.token', token);
        window.localStorage.setItem('todo.email', email);
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        const token = window.localStorage.getItem('todo.token');
        cy.request({
          url: '/api/me',
          headers: { Authorization: `Bearer ${token}` },
        })
          .its('status')
          .should('eq', 200);
      },
    },
  );
});

Cypress.Commands.add('a11yScan', (context) => {
  cy.injectAxe();
  cy.checkA11y(context, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
});

export {};
