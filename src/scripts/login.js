import '../styles/pages/_login.scss';
import { getAdminSession, signIn, signOut } from './services/auth.js';

const root = document.querySelector('[data-login]');
const form = root.querySelector('[data-login-form]');
const account = root.querySelector('[data-login-account]');
const status = root.querySelector('[data-login-status]');
const error = root.querySelector('[data-login-error]');
const submit = root.querySelector('[data-login-submit]');
const logout = root.querySelector('[data-login-logout]');
const retry = root.querySelector('[data-login-retry]');
const toggle = root.querySelector('[data-toggle-password]');
let busy = false;

function resetPassword() {
  form.elements.password.value = '';
  form.elements.password.type = 'password';
  toggle.textContent = 'Show';
  toggle.setAttribute('aria-pressed', 'false');
}
function showAccount(admin) {
  form.hidden = true;
  account.hidden = false;
  retry.hidden = true;
  root.querySelector('[data-admin-name]').textContent = admin.name;
  root.querySelector('[data-admin-email]').textContent = admin.email;
  root.querySelector('[data-login-subtitle]').textContent = 'Your admin account is connected.';
  status.textContent = '';
  resetPassword();
}
function showForm(message = '') {
  form.hidden = false;
  account.hidden = true;
  retry.hidden = true;
  error.textContent = '';
  root.querySelector('[data-login-subtitle]').textContent = 'Sign in to your admin account.';
  status.textContent = message;
}
async function checkSession() {
  if (busy) return;
  busy = true;
  retry.hidden = true;
  form.hidden = account.hidden = true;
  status.textContent = 'Checking your session…';
  try { showAccount((await getAdminSession()).admin); }
  catch (cause) {
    if (cause.code === 'UNAUTHENTICATED') showForm();
    else { status.textContent = cause.message; retry.hidden = false; }
  } finally { busy = false; }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  submit.disabled = true;
  error.textContent = '';
  status.textContent = 'Signing in…';
  try {
    showAccount((await signIn(form.elements.email.value.trim(), form.elements.password.value)).admin);
    logout.focus();
  } catch (cause) {
    status.textContent = '';
    error.textContent = cause.message;
    resetPassword();
    form.elements.password.focus();
  } finally { busy = false; submit.disabled = false; }
});
logout.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  logout.disabled = true;
  try {
    await signOut();
    showForm('You have signed out.');
    form.elements.email.focus();
  } catch (cause) { status.textContent = cause.message; }
  finally { busy = false; logout.disabled = false; }
});
toggle.addEventListener('click', () => {
  const show = form.elements.password.type === 'password';
  form.elements.password.type = show ? 'text' : 'password';
  toggle.textContent = show ? 'Hide' : 'Show';
  toggle.setAttribute('aria-pressed', String(show));
});
retry.addEventListener('click', checkSession);
window.addEventListener('pageshow', event => { if (event.persisted) checkSession(); });
await checkSession();
