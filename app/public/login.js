const form = document.querySelector('[data-cy="login-form"]');
const email = document.querySelector('[data-cy="login-email"]');
const password = document.querySelector('[data-cy="login-password"]');
const error = document.querySelector('[data-cy="login-error"]');
const submit = document.querySelector('[data-cy="login-submit"]');

if (new URLSearchParams(location.search).has('expired')) {
  document.querySelector('[data-cy="session-expired"]').hidden = false;
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;

  if (!email.value.trim() || !password.value) {
    showError('Enter your email and password.');
    return;
  }

  submit.disabled = true;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError(body.error?.message ?? 'Sign-in failed. Try again.');
      return;
    }
    localStorage.setItem('todo.token', body.token);
    localStorage.setItem('todo.email', body.user.email);
    location.assign('/');
  } catch {
    showError('Could not reach the server. Check your connection and try again.');
  } finally {
    submit.disabled = false;
  }
});
