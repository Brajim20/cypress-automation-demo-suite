/**
 * Todo list page object.
 *
 * Locators and user actions only. Assertions stay in the specs, so one page object serves the
 * happy path and the negative cases alike.
 */
export type Filter = 'all' | 'active' | 'completed';

export const todoPage = {
  visit(filter: Filter = 'all') {
    cy.visit(filter === 'all' ? '/' : `/#/${filter}`);
  },

  newTodoInput: () => cy.getByCy('new-todo'),
  inputError: () => cy.getByCy('new-todo-error'),
  items: () => cy.getByCy('todo-item'),
  titles: () => cy.getByCy('todo-title'),
  count: () => cy.getByCy('todo-count'),
  footer: () => cy.getByCy('footer'),
  emptyState: () => cy.getByCy('empty-state'),
  loading: () => cy.getByCy('loading'),
  errorBanner: () => cy.getByCy('error-banner'),
  retryButton: () => cy.getByCy('retry'),
  clearCompletedButton: () => cy.getByCy('clear-completed'),
  toggleAll: () => cy.getByCy('toggle-all'),
  filterLink: (filter: Filter) => cy.getByCy(`filter-${filter}`),

  /** The list item whose title is exactly `title`. */
  item(title: string) {
    return cy.contains('[data-cy="todo-item"]', new RegExp(`^${Cypress._.escapeRegExp(title)}$`));
  },

  /**
   * Visible titles, in on-screen order.
   *
   * Built only from queries (getByCy, invoke), so `.should('deep.equal', [...])` retries the
   * whole lookup. A `.then()` here would read the list once and assert on that snapshot.
   */
  visibleTitles(): Cypress.Chainable<string[]> {
    return cy
      .getByCy('todo-list')
      .invoke('find', '[data-cy="todo-title"]')
      .invoke('toArray')
      .invoke('map', (el: HTMLElement) => el.textContent ?? '');
  },

  addTodo(title: string) {
    cy.getByCy('new-todo').type(`${title}{enter}`);
  },

  toggle(title: string) {
    this.item(title).find('[data-cy="todo-toggle"]').click();
  },

  remove(title: string) {
    /* The delete button is revealed on hover in many TodoMVC skins; here it is always visible,
       so no { force: true } is needed, and adding one would hide a real visibility bug. */
    this.item(title).find('[data-cy="todo-delete"]').click();
  },

  startEditing(title: string) {
    this.item(title).find('[data-cy="todo-title"]').dblclick();
    return cy.getByCy('todo-edit');
  },

  filterBy(filter: Filter) {
    cy.getByCy(`filter-${filter}`).click();
  },
};
