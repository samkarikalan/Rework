/* ============================================================
   auth.js — Professional Auth Layer
   Uses Supabase Auth (email + password, no email confirmation)
   JWT stored in localStorage, refreshed automatically
   players table linked via auth.users.id
   ============================================================ */

/* ============================================================
   SESSION MANAGEMENT
   Supabase Auth returns: access_token, refresh_token, expires_at
============================================================ */

const AUTH_STORAGE_KEY    = 'kbrr_auth_session';
const AUTH_USER_KEY       = 'kbrr_auth_user';

function _saveSession(session) {
  if (!session) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    expires_at:    session.expires_at
  }));
}

function _getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function _clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem('kbrr_my_player');
  localStorage.removeItem('kbrr_my_club_id');
  localStorage.removeItem('kbrr_my_club_name');
  localStorage.removeItem('kbrr_club_mode');
  localStorage.removeItem('kbrr_cache_players');
  localStorage.removeItem('kbrr_cache_ts');
}

// Get auth headers using JWT instead of anon key
function _authHeaders() {
  const session = _getSession();
  const token   = session?.access_token || SUPABASE_KEY;
  return {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation'
  };
}

// Check if JWT is expired
function _isTokenExpired() {
  const session = _getSession();
  if (!session?.expires_at) return true;
  // expires_at is unix timestamp in seconds
  return Date.now() / 1000 > session.expires_at - 60; // 60s buffer
}

/* ============================================================
   TOKEN REFRESH
   Called automatically before any auth operation
============================================================ */

async function _refreshToken() {
  const session = _getSession();
  if (!session?.refresh_token) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body:    JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access_token) {
      _saveSession(data);
      return true;
    }
    return false;
  } catch(e) {
    return false;
  }
}

// Ensure token is fresh before operations
async function _ensureFreshToken() {
  if (_isTokenExpired()) {
    const refreshed = await _refreshToken();
    if (!refreshed) {
      _clearSession();
      return false;
    }
  }
  return true;
}

/* ============================================================
   PUBLIC AUTH API
============================================================ */

// Get current logged-in user
function authGetUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

// Is logged in and token not expired
function authIsLoggedIn() {
  const user    = authGetUser();
  const session = _getSession();
  if (!user || !session) return false;
  return true; // token refresh handled lazily
}

/* ── Sign Up ── */
async function authSignUp(email, password, displayName, gender) {
  email       = email.trim().toLowerCase();
  displayName = (displayName || '').trim();

  if (!email || !email.includes('@'))
    return { error: 'Please enter a valid email' };
  if (!password || password.length < 6)
    return { error: 'Password must be at least 6 characters' };
  if (!displayName || displayName.length < 2)
    return { error: 'Display name must be at least 2 characters' };

  try {
    // 1. Create Supabase Auth user
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body:    JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.msg || data.message || data.error_description || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists'))
        return { error: 'Email already registered. Please login.' };
      return { error: msg || 'Sign up failed. Please try again.' };
    }

    // 2. Save session
    if (data.access_token) {
      _saveSession(data);
    }

    // 3. Create player profile linked to auth user
    const authUserId = data.user?.id;
    if (!authUserId) return { error: 'Sign up failed. Please try again.' };

    const playerRes = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
      method:  'POST',
      headers: { ..._authHeaders(), 'Prefer': 'return=representation' },
      body:    JSON.stringify({
        id:            authUserId, // players.id = auth.users.id
        email,
        display_name:  displayName,
        gender:        gender || 'Male',
        global_rating: 1.0,
        global_points: 0
      })
    });

    if (!playerRes.ok) {
      const errBody = await playerRes.json().catch(() => ({}));
      console.warn('Player insert failed:', errBody);
      // Player might already exist (edge case) — try to fetch
      const existing = await _fetchPlayerProfile(authUserId);
      if (!existing) return { error: errBody.message || 'Profile creation failed. Please try again.' };
    }

    const player = playerRes.ok
      ? (await playerRes.json())[0]
      : await _fetchPlayerProfile(authUserId);

    // 4. Save user to localStorage
    const authUser = {
      id:          authUserId,
      email,
      displayName: player.display_name || displayName,
      gender:      player.gender || gender || 'Male'
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    setMyPlayer(player);

    return { user: authUser };

  } catch(e) {
    return { error: e.message || 'Sign up failed. Please try again.' };
  }
}

/* ── Login ── */
async function authLogin(email, password) {
  email = email.trim().toLowerCase();

  if (!email || !email.includes('@'))
    return { error: 'Please enter a valid email' };
  if (!password)
    return { error: 'Please enter your password' };

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body:    JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.msg || data.message || data.error_description || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials'))
        return { error: 'Invalid email or password' };
      return { error: msg || 'Login failed. Please try again.' };
    }

    // Save session (JWT)
    _saveSession(data);

    // Fetch player profile
    const authUserId = data.user?.id;
    const player     = await _fetchPlayerProfile(authUserId);

    if (!player) {
      // Player profile missing — create it
      await fetch(`${SUPABASE_URL}/rest/v1/players`, {
        method:  'POST',
        headers: { ..._authHeaders(), 'Prefer': 'return=representation' },
        body:    JSON.stringify({
          id:            authUserId,
          email,
          display_name:  email.split('@')[0],
          gender:        'Male',
          global_rating: 1.0,
          global_points: 0
        })
      });
    }

    const authUser = {
      id:          authUserId,
      email,
      displayName: player?.display_name || email.split('@')[0],
      gender:      player?.gender || 'Male'
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    // Always store player with id guaranteed
    const playerToStore = player
      ? { ...player, id: player.id || authUserId }
      : { id: authUserId, email, display_name: authUser.displayName, displayName: authUser.displayName };
    setMyPlayer(playerToStore);

    return { user: authUser };

  } catch(e) {
    return { error: e.message || 'Login failed. Please try again.' };
  }
}

/* ── Logout ── */
async function authLogout() {
  try {
    const session = _getSession();
    if (session?.access_token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${session.access_token}` }
      }).catch(() => {});
    }
  } finally {
    _clearSession();
  }
}

/* ── Password Reset (sends email when SMTP configured) ── */
async function authResetPassword(email) {
  email = email.trim().toLowerCase();
  if (!email || !email.includes('@')) return { error: 'Please enter a valid email' };

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body:    JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.msg || err.message || 'Reset failed' };
    }
    return { success: true };
  } catch(e) {
    return { error: e.message || 'Reset failed. Please try again.' };
  }
}

/* ── Update password (when logged in) ── */
async function authUpdatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6)
    return { error: 'Password must be at least 6 characters' };

  const fresh = await _ensureFreshToken();
  if (!fresh) return { error: 'Session expired. Please login again.' };

  try {
    const session = _getSession();
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${session.access_token}` },
      body:    JSON.stringify({ password: newPassword })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: err.msg || err.message || 'Update failed' };
    }
    return { success: true };
  } catch(e) {
    return { error: e.message || 'Update failed. Please try again.' };
  }
}

/* ── Update display name / gender ── */
async function authUpdateProfile(updates) {
  const user = authGetUser();
  if (!user) return { error: 'Not logged in' };

  const fresh = await _ensureFreshToken();
  if (!fresh) return { error: 'Session expired. Please login again.' };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${user.id}`, {
      method:  'PATCH',
      headers: _authHeaders(),
      body:    JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Update failed');

    // Update cached user
    const updated = { ...user, ...updates };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    return { success: true };
  } catch(e) {
    return { error: e.message || 'Update failed.' };
  }
}

/* ── Fetch player profile by auth user ID ── */
async function _fetchPlayerProfile(authUserId) {
  try {
    const rows = await fetch(
      `${SUPABASE_URL}/rest/v1/players?id=eq.${authUserId}&select=id,email,display_name,gender,global_rating,global_points`,
      { headers: _authHeaders() }
    ).then(r => r.json());
    return rows && rows.length ? rows[0] : null;
  } catch(e) { return null; }
}

/* ── Auto-refresh session on app load ── */
async function authInit() {
  const session = _getSession();
  if (!session) return false;

  if (_isTokenExpired()) {
    const refreshed = await _refreshToken();
    if (!refreshed) {
      _clearSession();
      return false;
    }
  }

  // Refresh player profile from DB
  const user = authGetUser();
  if (user?.id) {
    let player = await _fetchPlayerProfile(user.id);

    // Player row missing — create it now (handles signup RLS failure)
    if (!player) {
      try {
        const created = await fetch(`${SUPABASE_URL}/rest/v1/players`, {
          method:  'POST',
          headers: { ..._authHeaders(), 'Prefer': 'return=representation' },
          body: JSON.stringify({
            id:            user.id,
            email:         user.email,
            display_name:  user.displayName || user.email.split('@')[0],
            gender:        user.gender || 'Male',
            global_rating: 1.0,
            global_points: 0
          })
        }).then(r => r.json());
        player = Array.isArray(created) ? created[0] : created;
      } catch(e) {
        // Still no player — store minimal object with id so app doesn't break
        player = { id: user.id, email: user.email, display_name: user.displayName || '' };
      }
    }

    if (player) {
      const playerToStore = { ...player, id: player.id || user.id };
      setMyPlayer(playerToStore);
      const updated = {
        ...user,
        displayName: player.display_name || user.displayName,
        gender:      player.gender || user.gender || 'Male'
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    }
  }

  return true;
}

/* ── Make DB headers use JWT ── */
// Override SB_HEADERS dynamically so all sbGet/sbPost/sbPatch/sbDelete use JWT
function getAuthHeaders() {
  return _authHeaders();
}

// Patch the global SB_HEADERS to use JWT dynamically
// Called after login/refresh so all subsequent DB calls are authenticated
function _updateSbHeaders() {
  const session = _getSession();
  if (session?.access_token) {
    SB_HEADERS['Authorization'] = `Bearer ${session.access_token}`;
  }
}

