export const loginPage = {
  visit(query = '') {
    cy.visit(`/login${query}`);
  },

  emailInput: () => cy.getByCy('login-email'),
  passwordInput: () => cy.getByCy('login-password'),
  submitButton: () => cy.getByCy('login-submit'),
  error: () => cy.getByCy('login-error'),
  sessionExpiredNotice: () => cy.getByCy('session-expired'),

  signIn(email: string, password: string) {
    if (email) cy.getByCy('login-email').type(email);
    /* log: false keeps the password out of the command log and screenshots. */
    if (password) cy.getByCy('login-password').type(password, { log: false });
    cy.getByCy('login-submit').click();
  },
};
