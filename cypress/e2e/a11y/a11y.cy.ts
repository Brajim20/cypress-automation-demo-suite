import { todoPage } from '../../support/pages/todo.page';

/**
 * WCAG 2.1 A/AA scans with axe-core, one per distinct UI state.
 *
 * States matter more than pages: the error banner and the completed-item styling only exist
 * after something happens, so a scan of the initial page load would never see them.
 */
describe('Accessibility', { tags: ['@regression', '@a11y'] }, () => {
  const email = Cypress.expose('userEmail') as string;

  it('TC-A11Y-01 sign-in page, including the error state', () => {
    cy.visit('/login');
    cy.a11yScan();

    cy.getByCy('login-submit').click();
    cy.getByCy('login-error').should('be.visible');
    cy.a11yScan();
  });

  it('TC-A11Y-02 empty list', () => {
    cy.resetApp();
    cy.login();
    todoPage.visit();
    todoPage.emptyState().should('be.visible');
    cy.a11yScan();
  });

  it('TC-A11Y-03 populated list with a completed item and the footer', () => {
    cy.resetApp({ [email]: [{ title: 'Active item' }, { title: 'Done item', completed: true }] });
    cy.login();
    todoPage.visit();
    todoPage.items().should('have.length', 2);
    cy.a11yScan();
  });

  it('TC-A11Y-04 load-error banner', () => {
    cy.resetApp();
    cy.login();
    cy.intercept('GET', '/api/todos', { statusCode: 500, body: {} });
    todoPage.visit();
    todoPage.errorBanner().should('be.visible');
    cy.a11yScan();
  });
});
