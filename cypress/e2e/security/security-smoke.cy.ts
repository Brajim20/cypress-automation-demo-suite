import { todoPage } from '../../support/pages/todo.page';

/**
 * Security smoke checks: the automatable edge of security testing.
 *
 * These catch regressions in controls this app already has: output encoding, headers, session
 * revocation, account-enumeration resistance, request limits. They are not a penetration test
 * and don't replace one. See the "Security" section of docs/TEST_PLAN.md.
 */
describe('Security smoke', { tags: ['@regression', '@security'] }, () => {
  const email = Cypress.expose('userEmail') as string;

  const XSS_PAYLOADS = [
    '<img src=x onerror="window.__xss=1">',
    '<script>window.__xss=1</script>',
    '"><svg onload="window.__xss=1">',
    'javascript:window.__xss=1//',
  ];

  it(
    'TC-SEC-01 renders script-like titles as plain text and never executes them',
    { tags: '@smoke' },
    () => {
      cy.resetApp({ [email]: XSS_PAYLOADS.map((title) => ({ title })) });
      cy.login();
      todoPage.visit();

      todoPage.visibleTitles().should('deep.equal', XSS_PAYLOADS);
      cy.getByCy('todo-list').find('img, script, svg').should('not.exist');
      cy.window().its('__xss').should('be.undefined');
    },
  );

  it('TC-SEC-02 sends defensive headers on pages and API responses', () => {
    /* cy.request sees raw response headers. (The Cypress browser proxy strips CSP from pages
       it loads so it can instrument them, so this can't be checked through cy.visit.) */
    const expected = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    };
    for (const url of ['/', '/login', '/api/todos']) {
      cy.request({ url, failOnStatusCode: false }).then((res) => {
        for (const [header, value] of Object.entries(expected)) {
          expect(res.headers[header], `${header} on ${url}`).to.eq(value);
        }
        const csp = String(res.headers['content-security-policy']);
        expect(csp, `CSP on ${url}`).to.include("default-src 'self'");
        expect(csp, `CSP on ${url}`).to.include("frame-ancestors 'none'");
        expect(csp, `CSP on ${url}`).not.to.include('unsafe-inline');
      });
    }
  });

  it('TC-SEC-03 does not reveal whether an account exists', () => {
    const attempt = (address: string) =>
      cy.request({
        method: 'POST',
        url: '/api/login',
        body: { email: address, password: 'wrong-password' },
        failOnStatusCode: false,
      });

    attempt(email).then((known) => {
      attempt('nobody@example.com').then((unknown) => {
        expect(known.status).to.eq(401);
        expect(unknown.status).to.eq(401);
        expect(unknown.body, 'identical response bodies').to.deep.equal(known.body);
      });
    });
  });

  it('TC-SEC-04 revokes the token on sign-out', () => {
    cy.apiToken().then((token) => {
      const headers = { Authorization: `Bearer ${token}` };
      cy.request({ url: '/api/me', headers }).its('status').should('eq', 200);
      cy.request({ method: 'POST', url: '/api/logout', headers }).its('status').should('eq', 204);
      cy.request({ url: '/api/me', headers, failOnStatusCode: false })
        .its('status')
        .should('eq', 401);
    });
  });

  it('TC-SEC-05 refuses oversized request bodies', () => {
    cy.apiToken().then((token) => {
      cy.request({
        method: 'POST',
        url: '/api/todos',
        headers: { Authorization: `Bearer ${token}` },
        body: { title: 'x'.repeat(20_000) },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 413);
    });
  });

  it('TC-SEC-06 does not serve files outside the public directory', () => {
    for (const path of ['/%2e%2e/server.js', '/..%2fserver.js', '/package.json']) {
      cy.request({ url: path, failOnStatusCode: false }).then((res) => {
        expect(res.status, path).to.eq(404);
        expect(JSON.stringify(res.body), path).not.to.include('createServer');
      });
    }
  });
});
