import { defineConfig } from 'cypress';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';

export default defineConfig({
  /* Cypress 15 deprecates Cypress.env() in the browser. Turning it off makes any leftover use
     a hard error: public values go through Cypress.expose(), secrets through cy.env(). */
  allowCypressEnv: false,

  /* Public, non-secret settings. Readable in specs via Cypress.expose(). */
  expose: {
    userEmail: 'qa@example.com',
    otherUserEmail: 'other@example.com',
  },

  /* Secrets. Readable only through the cy.env() command, never baked into the spec bundle.
     The fallback is the demo app's documented local password; CI can override it. */
  env: {
    USER_PASSWORD: process.env.DEMO_PASSWORD ?? 'correct-horse-battery',
  },

  e2e: {
    baseUrl: process.env.BASE_URL ?? 'http://localhost:4173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 6_000,

    /* No retries on the gate. The target is local and deterministic, so a test that needs a
       retry to pass is flaky, and a retry would hide that. See docs/QA_PROCESS.md. */
    retries: { runMode: 0, openMode: 0 },

    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(_on, config) {
      cypressGrepPlugin(config);
      return config;
    },
  },
});
