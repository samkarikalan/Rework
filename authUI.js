/* ============================================================
   authUI.js
   UI functions for auth screens
   ============================================================ */

/* ── Show auth overlay and a specific screen ── */
function authShowScreen(screen) {
  var overlay = document.getElementById('authOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';

  // Hide all screens
  ['authWelcome','authLogin','authSignup','authForgot','authJoinClub'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Hide home + mode select
  var homeEl = document.getElementById('homePageOverlay');
  if (homeEl) homeEl.style.display = 'none';
  var modeEl = document.getElementById('modeSelectOverlay');
  if (modeEl) modeEl.style.display = 'none';

  // Show requested screen
  var screenMap = {
    'welcome':  'authWelcome',
    'login':    'authLogin',
    'signup':   'authSignup',
    'forgot':   'authForgot',
    'joinClub': 'authJoinClub'
  };
  var el = document.getElementById(screenMap[screen]);
  if (el) el.style.display = 'flex';

  // Clear errors
  ['loginError','signupError','forgotError','forgotError2','joinClubError'].forEach(function(id) {
    var err = document.getElementById(id);
    if (err) { err.style.display = 'none'; err.textContent = ''; }
  });
}

/* ── Hide auth overlay ── */
function authHideOverlay() {
  var overlay = document.getElementById('authOverlay');
  if (overlay) overlay.style.display = 'none';
}

/* ── Show error ── */
function authShowError(id, msg) {
  var el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

/* ── Show loading state on button ── */
function authSetLoading(btnSelector, loading) {
  var btn = document.querySelector(btnSelector);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn._origText = btn.textContent;
    btn.textContent = 'Please wait...';
  } else {
    btn.textContent = btn._origText || btn.textContent;
  }
}

/* ── Do Login ── */
async function authDoLogin() {
  var userId   = (document.getElementById('loginUserId')?.value || '').trim();
  var password = (document.getElementById('loginPassword')?.value || '');

  authSetLoading('#authLogin .auth-btn-primary', true);
  var result = await authLogin(userId, password);
  authSetLoading('#authLogin .auth-btn-primary', false);

  if (result.error) {
    authShowError('loginError', result.error);
    return;
  }

  // Login success — update profile button then check club
  if (typeof updateProfileBtn === 'function') updateProfileBtn();
  authAfterLogin(result.user);
}

/* ── Do Sign Up ── */
async function authDoSignup() {
  var userId   = (document.getElementById('signupUserId')?.value || '').trim();
  var nickname = (document.getElementById('signupNickname')?.value || '').trim();
  var email    = (document.getElementById('signupEmail')?.value || '').trim();
  var password = (document.getElementById('signupPassword')?.value || '');
  var confirm  = (document.getElementById('signupConfirm')?.value || '');

  if (password !== confirm) {
    authShowError('signupError', 'Passwords do not match');
    return;
  }

  authSetLoading('#authSignup .auth-btn-primary', true);
  var result = await authSignUp(userId, nickname, email, password);
  authSetLoading('#authSignup .auth-btn-primary', false);

  if (result.error) {
    authShowError('signupError', result.error);
    return;
  }

  // Auto login after signup
  var loginResult = await authLogin(userId, password);
  if (loginResult.error) {
    authShowError('signupError', 'Account created! Please login.');
    authShowScreen('login');
    return;
  }

  authAfterLogin(loginResult.user);
}

/* ── After successful login — check club ── */
async function authAfterLogin(user) {
  // Set player nickname for profile
  if (typeof setMyPlayer === 'function' && user.nickname) {
    setMyPlayer({ name: user.nickname, gender: 'Male' });
  }
  if (typeof updateProfileBtn === 'function') updateProfileBtn();

  // Check for pending invite
  var pending = (typeof authGetPendingInvite === 'function') ? authGetPendingInvite() : null;
  if (pending) {
    var joinInput = document.getElementById('joinClubCode');
    if (joinInput) joinInput.value = pending;
    authShowScreen('joinClub');
    return;
  }

  // Check if already in a club
  var club = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
  if (club && club.id) {
    // Already in club — go to app
    authHideOverlay();
    selectMode(sessionStorage.getItem('appMode') || 'viewer');
    return;
  }

  // No club — show join screen
  authShowScreen('joinClub');
}

/* ── Do Forgot Password — Send OTP ── */
async function authDoForgotSend() {
  var email = (document.getElementById('forgotEmail')?.value || '').trim();

  authSetLoading('#forgotStep1 .auth-btn-primary', true);
  var result = await authForgotSendOtp(email);
  authSetLoading('#forgotStep1 .auth-btn-primary', false);

  if (result.error) {
    authShowError('forgotError', result.error);
    return;
  }

  // Show OTP step
  var step1 = document.getElementById('forgotStep1');
  var step2 = document.getElementById('forgotStep2');
  if (step1) step1.style.display = 'none';
  if (step2) step2.style.display = 'block';

  if (AUTH_MOCK_MODE) {
    authShowError('forgotError2', '⚠️ Mock mode: check browser console for OTP');
  }
}

/* ── Do Forgot Password — Verify OTP ── */
async function authDoForgotVerify() {
  var email  = (document.getElementById('forgotEmail')?.value || '').trim();
  var otp    = (document.getElementById('forgotOtp')?.value || '').trim();
  var newPw  = (document.getElementById('forgotNewPw')?.value || '');

  authSetLoading('#forgotStep2 .auth-btn-primary', true);
  var result = await authForgotVerify(email, otp, newPw);
  authSetLoading('#forgotStep2 .auth-btn-primary', false);

  if (result.error) {
    authShowError('forgotError2', result.error);
    return;
  }

  // Success — go to login
  alert('Password reset successfully! Please login.');
  authShowScreen('login');
}

/* ── Do Join Club ── */
async function authDoJoinClub() {
  var code = (document.getElementById('joinClubCode')?.value || '').trim().toUpperCase();

  authSetLoading('#authJoinClub .auth-btn-primary', true);
  var result = await authJoinClub(code);
  authSetLoading('#authJoinClub .auth-btn-primary', false);

  if (result.error) {
    authShowError('joinClubError', result.error);
    return;
  }

  // Clear pending invite
  if (typeof authClearPendingInvite === 'function') authClearPendingInvite();

  // Success — go to app
  authHideOverlay();
  if (typeof updateProfileBtn === 'function') updateProfileBtn();
  selectMode(sessionStorage.getItem('appMode') || 'viewer');
}

/* ── Skip join club ── */
function authSkipJoin() {
  authHideOverlay();
  selectMode(sessionStorage.getItem('appMode') || 'viewer');
}

/* ── Logout ── */
function authDoLogout() {
  if (typeof authLogout === 'function') authLogout();
  // Reset app state
  if (typeof ResetAll === 'function') ResetAll();
  authShowScreen('welcome');
}
