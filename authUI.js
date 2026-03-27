/* ============================================================
   authUI.js — Auth UI Layer
   Clean email + password + display name flow
   No User ID, no OTP, no mock mode
   ============================================================ */

/* ── Show a specific auth screen ── */
function authShowScreen(screen) {
  const overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  // Hide home
  const homeEl = document.getElementById('homePageOverlay');
  if (homeEl) homeEl.style.display = 'none';

  // Hide all screens
  ['authWelcome','authLogin','authSignup','authForgot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Clear all errors
  document.querySelectorAll('.auth-error-msg').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });

  // Show requested screen
  const map = { welcome: 'authWelcome', login: 'authLogin', signup: 'authSignup', forgot: 'authForgot' };
  const el = document.getElementById(map[screen] || 'authWelcome');
  if (el) el.style.display = 'flex';
}

function authHideOverlay() {
  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';
}

function authShowError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function authClearError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function authSetLoading(btnId, loading, loadingText = 'Please wait…') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) { btn._orig = btn.textContent; btn.textContent = loadingText; }
  else         { btn.textContent = btn._orig || btn.textContent; }
}

/* ── LOGIN ── */
async function authDoLogin() {
  const email    = document.getElementById('loginEmail')?.value.trim() || '';
  const password = document.getElementById('loginPassword')?.value || '';

  authClearError('loginError');

  if (!email)    { authShowError('loginError', 'Please enter your email'); return; }
  if (!password) { authShowError('loginError', 'Please enter your password'); return; }

  authSetLoading('loginBtn', true, 'Signing in…');
  const result = await authLogin(email, password);
  authSetLoading('loginBtn', false);

  if (result.error) { authShowError('loginError', result.error); return; }

  _updateSbHeaders();
  authAfterLogin(result.user);
}

/* ── SIGN UP ── */
async function authDoSignup() {
  const email       = document.getElementById('signupEmail')?.value.trim() || '';
  const displayName = document.getElementById('signupDisplayName')?.value.trim() || '';
  const gender      = document.getElementById('signupGender')?.value || 'Male';
  const password    = document.getElementById('signupPassword')?.value || '';
  const confirm     = document.getElementById('signupConfirm')?.value || '';

  authClearError('signupError');

  if (password !== confirm) { authShowError('signupError', 'Passwords do not match'); return; }

  authSetLoading('signupBtn', true, 'Creating account…');
  const result = await authSignUp(email, password, displayName, gender);
  authSetLoading('signupBtn', false);

  if (result.error) { authShowError('signupError', result.error); return; }

  _updateSbHeaders();
  authAfterLogin(result.user);
}

/* ── AFTER LOGIN — go to app ── */
async function authAfterLogin(user) {
  if (typeof updateProfileBtn === 'function') updateProfileBtn();
  authHideOverlay();

  // Open unified mode sheet so user can pick mode + join club
  if (typeof _uSheetSelectedMode !== 'undefined') {
    _uSheetSelectedMode = 'viewer';
    _renderUnifiedSheet();
  } else {
    if (typeof selectMode === 'function') selectMode('viewer');
  }
}

/* ── FORGOT PASSWORD ── */
async function authDoForgotSend() {
  const email = document.getElementById('forgotEmail')?.value.trim() || '';
  authClearError('forgotError');

  if (!email || !email.includes('@')) {
    authShowError('forgotError', 'Please enter a valid email');
    return;
  }

  authSetLoading('forgotBtn', true, 'Sending…');
  const result = await authResetPassword(email);
  authSetLoading('forgotBtn', false);

  if (result.error) {
    // If SMTP not configured — tell user honestly
    authShowError('forgotError', 'Password reset requires email setup. Contact your club admin.');
    return;
  }

  authShowError('forgotError', '✅ Reset link sent to your email');
  document.getElementById('forgotError').style.color = 'var(--green)';
}

/* ── LOGOUT ── */
async function authDoLogout() {
  await authLogout();
  if (typeof ResetAll === 'function') ResetAll();
  window.location.reload(); // clean slate
}

/* ── JOIN REQUESTS (Vault) ── */
async function vaultLoadRequests() {
  const club   = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
  const listEl = document.getElementById('vaultRequestsList');
  if (!listEl) return;

  if (!club?.id) {
    listEl.innerHTML = '<div class="profile-sessions-empty">Connect to a club first.</div>';
    return;
  }

  listEl.innerHTML = '<div class="profile-sessions-loading">Loading…</div>';

  try {
    const requests = await dbGetJoinRequests(club.id);

    if (!requests || !requests.length) {
      listEl.innerHTML = '<div class="profile-sessions-empty">No pending requests.</div>';
      return;
    }

    listEl.innerHTML = requests.map(req => {
      const name    = req.nickname || req.players?.display_name || 'Unknown';
      const email   = req.players?.email || '';
      const gender  = req.players?.gender || 'Male';
      const reqDate = req.requested_at ? new Date(req.requested_at).toLocaleDateString() : '';
      return `
        <div class="vault-request-card">
          <div class="vault-request-info">
            <div class="vault-request-name">${name}</div>
            <div class="vault-request-id">${email} · ${reqDate}</div>
          </div>
          <div class="vault-request-actions">
            <button class="vault-request-accept" onclick="vaultAcceptRequest('${req.id}')">✓ Accept</button>
            <button class="vault-request-reject" onclick="vaultRejectRequest('${req.id}')">✗ Reject</button>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    listEl.innerHTML = '<div class="profile-sessions-empty">Failed to load requests.</div>';
  }
}

async function vaultAcceptRequest(requestId) {
  try {
    await dbApproveJoinRequest(requestId);
    dbInvalidateCache();
    if (typeof syncToLocal === 'function') await syncToLocal();
    vaultLoadRequests();
  } catch(e) {
    alert('Failed: ' + e.message);
  }
}

async function vaultRejectRequest(requestId) {
  try {
    await dbRejectJoinRequest(requestId);
    vaultLoadRequests();
  } catch(e) {
    alert('Failed: ' + e.message);
  }
}
