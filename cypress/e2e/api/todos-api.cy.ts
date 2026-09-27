import type { Todo } from '../../../src/utils/test-data';

/**
 * API contract tests with cy.request: no page is ever visited, so a failure here points at
 * the API rather than at rendering.
 */
describe('Todos API', { tags: '@regression' }, () => {
  const email = Cypress.expose('userEmail') as string;
  const otherEmail = Cypress.expose('otherUserEmail') as string;

  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeEach(() => {
    cy.resetApp();
    cy.apiToken(email).then((t) => (token = t));
  });

  const create = (title: unknown) =>
    cy.request({
      method: 'POST',
      url: '/api/todos',
      headers: auth(),
      body: { title },
      failOnStatusCode: false,
    });

  describe('authentication', () => {
    it(
      'TC-API-01 rejects requests without a token or with an invalid one',
      { tags: '@smoke' },
      () => {
        const cases = [
          { name: 'no header', headers: {} },
          { name: 'wrong scheme', headers: { Authorization: 'Basic abc' } },
          { name: 'unknown token', headers: { Authorization: `Bearer ${'0'.repeat(48)}` } },
        ];
        for (const { name, headers } of cases) {
          cy.request({ url: '/api/todos', headers, failOnStatusCode: false }).then((res) => {
            expect(res.status, name).to.eq(401);
            expect(res.body.error.code, name).to.eq('unauthenticated');
          });
        }
      },
    );
  });

  describe('reading and creating', () => {
    it('TC-API-02 lists todos in a stable envelope with a JSON content type', () => {
      cy.resetApp({ [email]: [{ title: 'One' }, { title: 'Two', completed: true }] });

      cy.request({ url: '/api/todos', headers: auth() }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.headers['content-type']).to.include('application/json');
        expect(res.body).to.have.all.keys('todos');

        const todos = res.body.todos as Todo[];
        expect(todos).to.have.length(2);
        for (const todo of todos) {
          expect(todo).to.have.all.keys('id', 'title', 'completed');
          expect(todo.id).to.be.a('number');
          expect(todo.title).to.be.a('string').and.not.be.empty;
          expect(todo.completed).to.be.a('boolean');
        }
        expect(new Set(todos.map((t) => t.id)).size, 'ids are unique').to.eq(todos.length);
      });
    });

    it(
      'TC-API-03 creates a todo, returns 201, and the new todo is listed',
      { tags: '@smoke' },
      () => {
        create('  Ship it  ').then((res) => {
          expect(res.status).to.eq(201);
          expect(res.body).to.include({ title: 'Ship it', completed: false });

          cy.request({ url: '/api/todos', headers: auth() })
            .its('body.todos')
            .should('deep.include', res.body);
        });
      },
    );

    it('TC-API-04 rejects invalid titles with a 400 and a machine-readable code', () => {
      const cases: { name: string; title: unknown; code: string }[] = [
        { name: 'empty', title: '', code: 'title_required' },
        { name: 'whitespace only', title: '   ', code: 'title_required' },
        { name: 'number', title: 42, code: 'title_invalid' },
        { name: 'null', title: null, code: 'title_invalid' },
        { name: 'missing', title: undefined, code: 'title_invalid' },
        { name: '201 characters', title: 'a'.repeat(201), code: 'title_too_long' },
      ];
      for (const { name, title, code } of cases) {
        create(title).then((res) => {
          expect(res.status, name).to.eq(400);
          expect(res.body.error, name).to.include({ code });
          expect(res.body.error.message, name).to.be.a('string').and.not.be.empty;
        });
      }
      cy.request({ url: '/api/todos', headers: auth() }).its('body.todos').should('be.empty');
    });

    it('TC-API-05 measures the length limit in characters, not UTF-16 units', () => {
      /* Boundary values on both sides of 200. "🙂" is two UTF-16 units, so a length check
         written with String.length would wrongly reject the 200-emoji title. */
      create('a'.repeat(200)).its('status').should('eq', 201);
      create('🙂'.repeat(200)).its('status').should('eq', 201);
      create('🙂'.repeat(201)).its('status').should('eq', 400);
    });

    it('TC-API-06 rejects a body that is not a JSON object', () => {
      cy.request({
        method: 'POST',
        url: '/api/todos',
        headers: { ...auth(), 'Content-Type': 'application/json' },
        body: '{"title": "unterminated',
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error.code).to.eq('invalid_json');
      });
    });
  });

  describe('updating and deleting', () => {
    let id: number;

    beforeEach(() => {
      create('Target').then((res) => (id = res.body.id));
    });

    it('TC-API-07 updates completed and title, and validates the types', () => {
      const patch = (body: object) =>
        cy.request({
          method: 'PATCH',
          url: `/api/todos/${id}`,
          headers: auth(),
          body,
          failOnStatusCode: false,
        });

      patch({ completed: true })
        .its('body')
        .should('include', { completed: true, title: 'Target' });
      patch({ title: '  Renamed  ' })
        .its('body')
        .should('include', { title: 'Renamed', completed: true });
      patch({ completed: 'yes' }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body.error.code).to.eq('completed_invalid');
      });
      patch({ title: '' }).its('status').should('eq', 400);
    });

    it('TC-API-08 deletes with 204, and a second delete is a 404', () => {
      const del = () =>
        cy.request({
          method: 'DELETE',
          url: `/api/todos/${id}`,
          headers: auth(),
          failOnStatusCode: false,
        });

      del().then((res) => {
        expect(res.status).to.eq(204);
        expect(res.body).to.be.empty;
      });
      del().its('status').should('eq', 404);
    });

    it('TC-API-09 clears completed todos and reports how many were removed', () => {
      cy.resetApp({
        [email]: [{ title: 'A' }, { title: 'B', completed: true }, { title: 'C', completed: true }],
      });
      cy.request({ method: 'POST', url: '/api/todos/clear-completed', headers: auth() })
        .its('body')
        .should('deep.equal', { deleted: 2 });
      cy.request({ url: '/api/todos', headers: auth() })
        .its('body.todos')
        .should('have.length', 1)
        .its(0)
        .should('include', { title: 'A' });
    });
  });

  describe('authorisation between users', () => {
    it("TC-API-10 cannot read, change or delete another user's todo", { tags: '@smoke' }, () => {
      create('Private to qa@').then(({ body: mine }) => {
        cy.apiToken(otherEmail).then((otherToken) => {
          const asOther = { Authorization: `Bearer ${otherToken}` };

          cy.request({ url: '/api/todos', headers: asOther })
            .its('body.todos')
            .should('not.deep.include', mine);

          /* 404 rather than 403: a 403 would confirm to the caller that id exists. */
          for (const method of ['PATCH', 'DELETE'] as const) {
            cy.request({
              method,
              url: `/api/todos/${mine.id}`,
              headers: asOther,
              body: { completed: true },
              failOnStatusCode: false,
            })
              .its('status')
              .should('eq', 404);
          }
        });

        /* And the owner's todo is untouched. */
        cy.request({ url: '/api/todos', headers: auth() })
          .its('body.todos')
          .should('deep.include', mine);
      });
    });
  });
});
