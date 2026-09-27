import { loginPage } from '../../support/pages/login.page';

/**
 * The sign-in form, driven through the UI.
 *
 * This is the only spec that signs in through the form. Everything else uses cy.login(),
 * which goes through the API, so a broken form fails here and only here.
 */
describe('Sign in', { tags: '@regression' }, () => {
  const email = Cypress.expose('userEmail') as string;

  beforeEach(() => {
    cy.resetApp();
  });

  it(
    'TC-AUTH-01 signs in with valid credentials and lands on the todo list',
    { tags: '@smoke' },
    () => {
      loginPage.visit();
      cy.env<{ USER_PASSWORD: string }>(['USER_PASSWORD']).then(({ USER_PASSWORD }) => {
        loginPage.signIn(email, USER_PASSWORD);
      });

      cy.location('pathname').should('eq', '/');
      cy.getByCy('current-user').should('have.text', email);
      cy.getByCy('empty-state').should('be.visible');
    },
  );

  it('TC-AUTH-02 rejects a wrong password and stays on the sign-in page', () => {
    loginPage.visit();
    loginPage.signIn(email, 'not-the-password');

    loginPage.error().should('be.visible').and('have.text', 'Email or password is incorrect.');
    cy.location('pathname').should('eq', '/login');
    cy.window().its('localStorage').invoke('getItem', 'todo.token').should('be.null');
  });

  it('TC-AUTH-03 gives an unknown email the same message as a wrong password', () => {
    /* A different message would tell an attacker which addresses have accounts. */
    loginPage.visit();
    loginPage.signIn('nobody@example.com', 'not-the-password');

    loginPage.error().should('have.text', 'Email or password is incorrect.');
  });

  it('TC-AUTH-04 validates an empty form without calling the API', () => {
    cy.intercept('POST', '/api/login').as('login');
    loginPage.visit();
    loginPage.submitButton().click();

    loginPage.error().should('have.text', 'Enter your email and password.');
    /* Proves the check is client-side: the request was never made. */
    cy.get('@login.all').should('have.length', 0);
  });

  it('TC-AUTH-05 redirects a signed-out visitor to the sign-in page', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
  });

  it('TC-AUTH-06 signs out, and the old token stops working', () => {
    /* Signs in fresh rather than reusing the cached cy.session: signing out revokes the token,
       and revoking the shared cached one would knock every later test back to /login. */
    loginPage.visit();
    cy.env<{ USER_PASSWORD: string }>(['USER_PASSWORD']).then(({ USER_PASSWORD }) => {
      loginPage.signIn(email, USER_PASSWORD);
    });
    cy.location('pathname').should('eq', '/');

    cy.window()
      .its('localStorage')
      .invoke('getItem', 'todo.token')
      .should('be.a', 'string')
      .then((token) => {
        cy.getByCy('logout').click();
        cy.location('pathname').should('eq', '/login');

        cy.request({
          url: '/api/me',
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        })
          .its('status')
          .should('eq', 401);
      });
  });
});
