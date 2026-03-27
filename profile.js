/* ============================================================
   PROFILE DRAWER — Player identity, stats, recent sessions
   File: profile.js
   ============================================================ */

const PROFILE_KEY = 'kbrr_my_player';
let _profileSwitching = false; // true while user is mid-switch
let _previousPlayer   = null;  // saved before switch so cancel can restore

function getMyPlayer() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (!p) return null;
    // Normalize fields for compatibility
    if (p.display_name && !p.displayName) p.displayName = p.display_name;
    if (p.displayName && !p.name) p.name = p.displayName;
    // Ensure id — fall back to auth user
    if (!p.id) {
      try {
        const u = JSON.parse(localStorage.getItem('kbrr_auth_user') || 'null');
        if (u?.id) p.id = u.id;
      } catch(e) {}
    }
    return p.id ? p : null;
  } catch(e) { return null; }
}

function setMyPlayer(playerObj) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(playerObj));
}

function clearMyPlayer() {
  localStorage.removeItem(PROFILE_KEY);
}

/* ── Tier label from rating ── */
function ratingTierLabel(r) {
  if (r < 2.0) return { label: 'Rookie',       color: '#9e9e9e' };
  if (r < 3.0) return { label: 'Club',          color: '#4a9eff' };
  if (r < 4.0) return { label: 'Competitive',   color: '#2dce89' };
  if (r < 4.5) return { label: 'Advanced',      color: '#f5a623' };
  return             { label: 'Elite',           color: '#e63757' };
}

/* ── Update header profile button appearance ── */
async function updateProfileBtn() {
  const player = getMyPlayer();
  const src = player ? (player.gender === 'Female' ? 'female.png' : 'male.png') : null;

  // Update profile buttons (main top bar + home overlay)
  [
    { avatar: 'profileBtnAvatar',  icon: 'profileBtnIcon'  },
    { avatar: 'homeProfileAvatar', icon: 'homeProfileIcon' },
  ].forEach(function(ids) {
    const avatarEl = document.getElementById(ids.avatar);
    const iconEl   = document.getElementById(ids.icon);
    if (!avatarEl || !iconEl) return;
    if (player) {
      avatarEl.src           = src;
      avatarEl.style.display = 'block';
      iconEl.style.display   = 'none';
    } else {
      avatarEl.style.display = 'none';
      iconEl.style.display   = 'block';
    }
  });

  // Update home profile tile
  const tileAvatar = document.getElementById('homeTileAvatar');
  const tileIcon   = document.getElementById('homeTileIcon');
  const tileName   = document.getElementById('homeTileName');
  const tileRating = document.getElementById('homeTileRating');

  if (!player) {
    if (tileAvatar) tileAvatar.style.display = 'none';
    if (tileIcon)   { tileIcon.style.display = ''; tileIcon.textContent = '👤'; }
    if (tileName)   tileName.textContent = 'My Profile';
    if (tileRating) tileRating.textContent = 'Not selected';
    return;
  }

  if (tileAvatar) { tileAvatar.src = src; tileAvatar.style.display = 'block'; }
  if (tileIcon)   tileIcon.style.display = 'none';
  if (tileName)   tileName.textContent = player.displayName || player.name || '';
  if (tileRating) tileRating.textContent = 'Loading...';

  try {
    const master = JSON.parse(localStorage.getItem('newImportHistory') || '[]');
    const hp = master.find(function(h) {
      return h.displayName && h.displayName.trim().toLowerCase() === (player.displayName || player.name || '').trim().toLowerCase();
    });
    const clubRating = parseFloat(hp && hp.clubRating) || 1.0;

    const club  = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
    const today = new Date().toISOString().split('T')[0];
    let wins = 0, losses = 0, hasSession = false;

    if (club.id) {
      // live_sessions removed — match data now in sessions.rounds_data
      const liveRows = []; // live_sessions removed — match data now in sessions.rounds_data
      if (liveRows && liveRows.length) {
        const matches = typeof liveRows[0].matches === 'string'
          ? JSON.parse(liveRows[0].matches) : (liveRows[0].matches || []);
        wins   = matches.filter(function(m) { return m.result === 'W'; }).length;
        losses = matches.filter(function(m) { return m.result === 'L'; }).length;
        hasSession = matches.length > 0;
      }
    }

    if (tileRating) {
      tileRating.textContent = hasSession
        ? 'Club ' + clubRating.toFixed(1) + '  ·  W:' + wins + ' L:' + losses
        : 'Club ' + clubRating.toFixed(1);
    }
  } catch(e) {
    const master = JSON.parse(localStorage.getItem('newImportHistory') || '[]');
    const hp = master.find(function(h) {
      return h.displayName && h.displayName.trim().toLowerCase() === (player.displayName || player.name || '').trim().toLowerCase();
    });
    const clubRating = parseFloat(hp && hp.clubRating) || 1.0;
    if (tileRating) tileRating.textContent = 'Club ' + clubRating.toFixed(1);
  }
}



/* ── Open drawer ── */
async function openProfileDrawer() {
  const overlay = document.getElementById('profileOverlay');
  const drawer  = document.getElementById('profileDrawer');
  overlay.classList.remove('hidden');
  drawer.classList.add('open');

  let player = getMyPlayer();

  // If no player stored but user is logged in via auth — use auth user directly
  if (!player) {
    try {
      const authUser = JSON.parse(localStorage.getItem('kbrr_auth_user') || 'null');
      if (authUser?.id) {
        player = {
          id:          authUser.id,
          name:        authUser.displayName || authUser.email?.split('@')[0] || 'Player',
          displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Player',
          gender:      authUser.gender || 'Male',
          email:       authUser.email
        };
        setMyPlayer(player);
      }
    } catch(e) {}
  }

  if (player) {
    showProfileCard(player);
  } else {
    showProfilePicker();
  }
}

/* ── Close drawer ── */
function closeProfileDrawer() {
  const player = getMyPlayer();
  if (!player) {
    if (_profileSwitching && _previousPlayer) {
      // Cancel switch — restore previous player and close
      _profileSwitching = false;
      setMyPlayer(_previousPlayer);
      updateProfileBtn();
      _previousPlayer = null;
    } else {
      // No profile at all — block closing
      return;
    }
  }
  document.getElementById('profileOverlay').classList.add('hidden');
  document.getElementById('profileDrawer').classList.remove('open');
}

/* ── Show player picker — loads from Supabase ── */
let _pickerAllPlayers = []; // cache for search filtering

function showProfilePicker() {
  document.getElementById('profilePicker').style.display    = 'block';
  document.getElementById('profileCard').style.display      = 'none';
  document.getElementById('pickerListView').style.display   = 'block';
  document.getElementById('pinScreenView').style.display    = 'none';

  const list = document.getElementById('profilePickerList');
  list.innerHTML = '<div class="profile-sessions-loading">Loading players...</div>';

  // Clear search box
  const searchEl = document.getElementById('profileSearch');
  if (searchEl) searchEl.value = '';

  // Load club players via memberships
  const _pickerClub = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
  const _pickerQuery = _pickerClub.id
    ? sbGet('memberships', 'club_id=eq.' + _pickerClub.id + '&select=nickname,club_rating,players(id,gender,pin,recovery_word)&order=nickname.asc')
    : sbGet('players', 'order=display_name.asc&select=id,display_name,gender,pin,recovery_word');

  _pickerQuery.then(rows => {
    _pickerAllPlayers = (rows || []).map(p => ({
      name:          _pickerClub.id ? p.nickname : (p.display_name || p.nickname),
      gender:        _pickerClub.id ? (p.players?.gender || 'Male') : (p.gender || 'Male'),
      rating:        _pickerClub.id ? (parseFloat(p.club_rating) || 1.0) : 1.0,
      club_ratings:  {},
      pin:           _pickerClub.id ? (p.players?.pin || null) : (p.pin || null),
      recovery_word: _pickerClub.id ? (p.players?.recovery_word || null) : (p.recovery_word || null)
    }));
    renderPickerList(_pickerAllPlayers);
  }).catch(() => {
    // Fallback to session players if offline
    _pickerAllPlayers = (typeof schedulerState !== 'undefined' && schedulerState.allPlayers.length)
      ? schedulerState.allPlayers
      : [];
    renderPickerList(_pickerAllPlayers);
  });
}

function renderPickerList(players) {
  const list = document.getElementById('profilePickerList');
  list.innerHTML = '';

  if (!players.length) {
    list.innerHTML = '<div class="profile-picker-empty">No players found in your club.</div>';
    return;
  }

  players.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'profile-picker-item';
    btn.innerHTML = `
      <img src="${p.gender === 'Female' ? 'female.png' : 'male.png'}" class="profile-picker-avatar">
      <span>${p.name}</span>
    `;
    btn.onclick = () => profileSelectPlayer(p);
    list.appendChild(btn);
  });
}

function filterPickerList(query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? _pickerAllPlayers.filter(p => p.name.toLowerCase().includes(q))
    : _pickerAllPlayers;
  renderPickerList(filtered);
}

/* ── PIN FLOW ── */

// Entry point when player name tapped
function profileSelectPlayer(p) {
  if (!p.pin) {
    // No PIN yet — show setup screen
    showPinSetup(p);
  } else {
    // PIN exists — show login screen
    showPinLogin(p);
  }
}

// Render a PIN screen inside the picker area
function _showPinScreen(html) {
  document.getElementById('pickerListView').style.display  = 'none';
  const pinView = document.getElementById('pinScreenView');
  pinView.style.display = 'block';
  pinView.innerHTML = `
    <div class="profile-drawer-header">
      <span class="profile-drawer-title">Who are you?</span>
      <button class="profile-drawer-close" onclick="showProfilePicker()">✕</button>
    </div>
    <div class="pin-screen">${html}</div>`;
}

// ── Setup: first time — set PIN + recovery word ──
function showPinSetup(p) {
  _showPinScreen(`
    <div class="pin-name">${p.name}</div>
    <p class="pin-hint">First time? Set a 4-digit PIN and a recovery word.</p>
    <input id="pinSetupPin" type="password" inputmode="numeric" maxlength="4"
      class="pin-input" placeholder="Set PIN (4 digits)">
    <input id="pinSetupConfirm" type="password" inputmode="numeric" maxlength="4"
      class="pin-input" placeholder="Confirm PIN">
    <input id="pinSetupRecovery" type="text" class="pin-input"
      placeholder="Recovery word (secret)">
    <div id="pinSetupError" class="pin-error"></div>
    <button class="pin-btn" onclick="confirmPinSetup('${p.name.replace(/'/g,"\\'")}')">Save & Continue</button>
  `);
}

async function confirmPinSetup(name) {
  const pin     = document.getElementById('pinSetupPin').value.trim();
  const confirm = document.getElementById('pinSetupConfirm').value.trim();
  const recovery = document.getElementById('pinSetupRecovery').value.trim().toLowerCase();
  const err     = document.getElementById('pinSetupError');

  if (!/^\d{4}$/.test(pin))       { err.textContent = 'PIN must be exactly 4 digits.'; return; }
  if (pin !== confirm)             { err.textContent = 'PINs do not match.'; return; }
  if (recovery.length < 3)        { err.textContent = 'Recovery word too short.'; return; }

  err.textContent = '⏳ Saving...';
  try {
    // pin and recovery_word are on players table
    const _club = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
    if (_club.id) {
      const _mrows = await sbGet('memberships', 'club_id=eq.' + _club.id + '&nickname=ilike.' + encodeURIComponent(name) + '&select=player_id').catch(() => []);
      if (_mrows.length) {
        await sbPatch('players', 'id=eq.' + _mrows[0].player_id, { pin, recovery_word: recovery });
      }
    }
    const p = _pickerAllPlayers.find(x => x.name === name);
    if (p) { p.pin = pin; p.recovery_word = recovery; }
    err.textContent = '';
    _completeProfileSelection(name);
  } catch(e) {
    err.textContent = 'Failed to save. Try again.';
  }
}

// ── Login: enter PIN ──
function showPinLogin(p) {
  _showPinScreen(`
    <div class="pin-name">${p.name}</div>
    <p class="pin-hint">Enter your PIN to continue.</p>
    <input id="pinLoginPin" type="password" inputmode="numeric" maxlength="4"
      class="pin-input" placeholder="Enter PIN">
    <div id="pinLoginError" class="pin-error"></div>
    <button class="pin-btn" onclick="confirmPinLogin('${p.name.replace(/'/g,"\\'")}')">Continue</button>
    <button class="pin-btn-secondary" onclick="showPinRecovery('${p.name.replace(/'/g,"\\'")}')">Forgot PIN?</button>
  `);
  // Allow Enter key
  setTimeout(() => {
    const el = document.getElementById('pinLoginPin');
    if (el) el.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmPinLogin(p.name);
    });
  }, 50);
}

function confirmPinLogin(name) {
  const entered = document.getElementById('pinLoginPin').value.trim();
  const err     = document.getElementById('pinLoginError');
  const p       = _pickerAllPlayers.find(x => x.name === name);
  if (!p) { err.textContent = 'Player not found.'; return; }
  if (entered !== p.pin) { err.textContent = '❌ Wrong PIN. Try again.'; return; }
  _completeProfileSelection(name);
}

// ── Recovery: enter recovery word → reset PIN ──
function showPinRecovery(name) {
  _showPinScreen(`
    <div class="pin-name">${name}</div>
    <p class="pin-hint">Enter your recovery word to reset your PIN.</p>
    <input id="pinRecoveryWord" type="text" class="pin-input" placeholder="Recovery word">
    <input id="pinRecoveryNew" type="password" inputmode="numeric" maxlength="4"
      class="pin-input" placeholder="New PIN (4 digits)">
    <input id="pinRecoveryConfirm" type="password" inputmode="numeric" maxlength="4"
      class="pin-input" placeholder="Confirm new PIN">
    <div id="pinRecoveryError" class="pin-error"></div>
    <button class="pin-btn" onclick="confirmPinRecovery('${name.replace(/'/g,"\\'")}')">Reset PIN</button>
    <button class="pin-btn-secondary" onclick="showProfilePicker()">Back</button>
  `);
}

async function confirmPinRecovery(name) {
  const word    = document.getElementById('pinRecoveryWord').value.trim().toLowerCase();
  const newPin  = document.getElementById('pinRecoveryNew').value.trim();
  const confirm = document.getElementById('pinRecoveryConfirm').value.trim();
  const err     = document.getElementById('pinRecoveryError');
  const p       = _pickerAllPlayers.find(x => x.name === name);

  if (!p) { err.textContent = 'Player not found.'; return; }
  if (word !== (p.recovery_word || '').toLowerCase()) {
    err.textContent = '❌ Wrong recovery word.'; return;
  }
  if (!/^\d{4}$/.test(newPin))    { err.textContent = 'PIN must be 4 digits.'; return; }
  if (newPin !== confirm)          { err.textContent = 'PINs do not match.'; return; }

  err.textContent = '⏳ Saving...';
  try {
    // pin stored on players table via player id
    const _pinPlayer = (typeof getMyPlayer === 'function') ? getMyPlayer() : null;
    if (_pinPlayer?.id) await sbPatch('players', `id=eq.${_pinPlayer.id}`, { pin: newPin });
    p.pin = newPin;
    err.textContent = '';
    _completeProfileSelection(name);
  } catch(e) {
    err.textContent = 'Failed to save. Try again.';
  }
}

// ── Final step: set profile and open card ──
function _completeProfileSelection(name) {
  _profileSwitching = false;
  _previousPlayer   = null;
  const p = _pickerAllPlayers.find(x => x.name === name);
  const player = { name, gender: (p && p.gender) || 'Male' };
  setMyPlayer(player);
  updateProfileBtn();
  showProfileCard(player);
}

/* ── Switch player ── */
function switchProfilePlayer() {
  _previousPlayer   = getMyPlayer(); // save so cancel can restore
  _profileSwitching = true;
  clearMyPlayer();
  updateProfileBtn();
  showProfilePicker();
}

/* ── Get sessions for a player — localStorage first, then Supabase ── */
function getLocalSessions(playerName) {
  try {
    const lsKey = `kbrr_sessions_${playerName.toLowerCase().replace(/\s+/g, '_')}`;
    return JSON.parse(localStorage.getItem(lsKey) || '[]');
  } catch { return []; }
}

function mergeSessions(local, remote) {
  // Merge by date, prefer local (more up to date), deduplicate
  const map = new Map();
  [...remote, ...local].forEach(s => map.set(s.date, s)); // local overwrites remote
  return Array.from(map.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
}

/* ── Show profile card ── */
async function showProfileCard(player) {
  document.getElementById('profilePicker').style.display = 'none';
  document.getElementById('profileCard').style.display   = 'block';

  // Avatar
  document.getElementById('pcAvatar').src =
    player.gender === 'Female' ? 'female.png' : 'male.png';

  // Name
  document.getElementById('pcName').textContent = player.displayName || player.name || '';

  // Get ratings — use player's own data from DB if available
  let globalRating = parseFloat(player.global_rating || player.globalRating) || 1.0;
  let clubRating   = parseFloat(player.club_rating   || player.clubRating)   || 1.0;

  // Try to get fresh data from DB using player id
  if (player.id) {
    try {
      const _prows = await sbGet('players', 'id=eq.' + player.id + '&select=global_rating,global_points').catch(() => []);
      if (_prows.length) globalRating = parseFloat(_prows[0].global_rating) || globalRating;

      const _club = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
      if (_club.id) {
        const _mrows2 = await sbGet('memberships', 'player_id=eq.' + player.id + '&club_id=eq.' + _club.id + '&select=club_rating,club_points').catch(() => []);
        if (_mrows2.length) clubRating = parseFloat(_mrows2[0].club_rating) || clubRating;
      }
    } catch(e) {}
  } else {
    // Fallback to local cache
    const master = JSON.parse(localStorage.getItem('newImportHistory') || '[]');
    const hp = master.find(h => h.displayName && h.displayName.trim().toLowerCase() === (player.displayName || player.name || '').trim().toLowerCase());
    globalRating = parseFloat(hp && hp.rating)     || globalRating;
    clubRating   = parseFloat(hp && hp.clubRating) || clubRating;
  }

  const activeRating = clubRating;
  const tier         = ratingTierLabel(activeRating);

  document.getElementById('pcRating').textContent     = globalRating.toFixed(1);
  document.getElementById('pcClubRating').textContent = clubRating.toFixed(1);
  document.getElementById('pcTier').textContent       = tier.label;
  document.getElementById('pcTier').style.background  = tier.color + '22';
  document.getElementById('pcTier').style.color       = tier.color;

  // Fetch wins/losses from matches table
  document.getElementById('pcWins').textContent   = '…';
  document.getElementById('pcLosses').textContent = '…';
  try {
    const _club = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
    let _w = 0, _l = 0;
    const _pid = player.id; // use player id directly
    if (_pid) {
      const _q = _club.id
        ? 'club_id=eq.' + _club.id + '&select=winner_pair,pair1_player1,pair1_player2,pair2_player1,pair2_player2'
        : 'select=winner_pair,pair1_player1,pair1_player2,pair2_player1,pair2_player2';
      const _matches = await sbGet('matches', _q).catch(() => []);
      for (const _m of _matches) {
        const _in1 = _m.pair1_player1 === _pid || _m.pair1_player2 === _pid;
        const _in2 = _m.pair2_player1 === _pid || _m.pair2_player2 === _pid;
        if (!_in1 && !_in2) continue;
        if ((_in1 && _m.winner_pair === 'pair1') || (_in2 && _m.winner_pair === 'pair2')) _w++; else _l++;
      }
    }
    document.getElementById('pcWins').textContent   = _w || '—';
    document.getElementById('pcLosses').textContent = _l || '—';
  } catch(e) {
    document.getElementById('pcWins').textContent   = '—';
    document.getElementById('pcLosses').textContent = '—';
  }
}

/* ── Helper: get gender of a player ── */
function getPlayerGender(name) {
  if (typeof schedulerState !== 'undefined' && schedulerState.allPlayers) {
    const p = schedulerState.allPlayers.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
    if (p) return p.gender || 'Male';
  }
  return 'Male';
}

/* ── Render PDF-style match rows ── */
function renderMatchRow(m, playerName) {
  const isWin          = m.result === 'W';
  const partner        = m.partner        || [];
  const partnerGenders = m.partnerGenders || partner.map(() => 'Male');
  const opponents      = m.opponents      || [];
  const oppGenders     = m.opponentGenders || opponents.map(() => 'Male');
  const myGender       = m.myGender || 'Male';
  const date           = m.date || '';

  const makePlayer = (name, gender) =>
    `<div class="mc-match-player">
      <img src="${gender === 'Female' ? 'female.png' : 'male.png'}" class="mc-match-avatar">
      <span class="mc-match-name">${name}</span>
    </div>`;

  const myTeam  = [makePlayer(playerName, myGender), ...partner.map((n, i) => makePlayer(n, partnerGenders[i]))].join('');
  const oppTeam = opponents.map((n, i) => makePlayer(n, oppGenders[i])).join('');

  return `
    <div class="mc-match-card ${isWin ? 'mc-win' : 'mc-loss'}">
      <div class="mc-match-team mc-match-top">
        <div class="mc-match-players">${myTeam}</div>
        ${isWin ? '<div class="mc-match-cup">🏆</div>' : ''}
      </div>
      <div class="mc-match-divider">
        <div class="mc-match-divider-line"></div>
        <span class="mc-match-result-badge ${isWin ? 'mc-badge-win' : 'mc-badge-loss'}">${isWin ? 'WIN' : 'LOSS'}</span>
        <div class="mc-match-divider-line"></div>
      </div>
      <div class="mc-match-team mc-match-bottom">
        <div class="mc-match-players">${oppTeam}</div>
        ${!isWin ? '<div class="mc-match-cup">🏆</div>' : ''}
      </div>
      ${date ? `<div class="mc-match-date">${date}</div>` : ''}
    </div>`;
}

/* ── My Card Page ── */
async function renderMyCard() {
  const player = (typeof getMyPlayer === 'function') ? getMyPlayer() : null;

  const emptyEl   = document.getElementById('myCardEmpty');
  const contentEl = document.getElementById('myCardContent');

  if (!player) {
    if (emptyEl)   emptyEl.style.display   = '';
    if (contentEl) contentEl.style.display = 'none';
    return;
  }

  if (emptyEl)   emptyEl.style.display   = 'none';
  if (contentEl) contentEl.style.display = '';

  // Avatar + Name
  const avatar = document.getElementById('mcAvatar');
  if (avatar) avatar.src = player.gender === 'Female' ? 'female.png' : 'male.png';
  const nameEl = document.getElementById('mcName');
  if (nameEl) nameEl.textContent = player.displayName || player.name || '';

  // Ratings from local cache
  await syncToLocal();
  const master       = JSON.parse(localStorage.getItem('newImportHistory') || '[]');
  const hp           = master.find(h => h.displayName && h.displayName.trim().toLowerCase() === (player.displayName || player.name || '').trim().toLowerCase());
  const globalRating = parseFloat(hp && hp.rating)       || 1.0;
  const clubRating   = parseFloat(hp && hp.clubRating)   || 1.0;
  const activeRating = parseFloat(hp && hp.activeRating) || 1.0;
  const tier         = ratingTierLabel(activeRating);

  const grEl = document.getElementById('mcGlobalRating');
  const crEl = document.getElementById('mcClubRating');
  const tierEl = document.getElementById('mcTier');
  if (grEl)   grEl.textContent  = globalRating.toFixed(1);
  if (crEl)   crEl.textContent  = clubRating.toFixed(1);
  if (tierEl) { tierEl.textContent = tier.label; tierEl.style.background = tier.color + '22'; tierEl.style.color = tier.color; }

  // Wins / Losses + Sessions from DB
  const winsEl   = document.getElementById('mcWins');
  const lossesEl = document.getElementById('mcLosses');
  const sessEl   = document.getElementById('mcSessions');
  if (winsEl)   winsEl.textContent   = '…';
  if (lossesEl) lossesEl.textContent = '…';
  if (sessEl)   sessEl.innerHTML     = '<div class="profile-sessions-loading">Loading...</div>';

  try {
    const club  = (typeof getMyClub === 'function') ? getMyClub() : { id: null };
    const today = new Date().toISOString().split('T')[0];

    // Get wins/losses from matches table for this player in this club
    const playerName = player.displayName || player.name || '';
    let totalWins = 0, totalLosses = 0;

    if (club.id && playerName) {
      const memberRows = await sbGet('memberships',
        'club_id=eq.' + club.id + '&nickname=ilike.' + encodeURIComponent(playerName) + '&select=player_id'
      ).catch(() => []);

      if (memberRows.length) {
        const pid = memberRows[0].player_id;
        const matchRows = await sbGet('matches',
          'club_id=eq.' + club.id + '&select=winner_pair,pair1_player1,pair1_player2,pair2_player1,pair2_player2'
        ).catch(() => []);

        for (const m of matchRows) {
          const inPair1 = m.pair1_player1 === pid || m.pair1_player2 === pid;
          const inPair2 = m.pair2_player1 === pid || m.pair2_player2 === pid;
          if (!inPair1 && !inPair2) continue;
          const won = (inPair1 && m.winner_pair === 'pair1') || (inPair2 && m.winner_pair === 'pair2');
          if (won) totalWins++; else totalLosses++;
        }
      }
    }

    if (winsEl)   winsEl.textContent   = totalWins;
    if (lossesEl) lossesEl.textContent = totalLosses;

    const lsKey         = 'kbrr_sessions_' + playerName.toLowerCase().replace(/\s+/g, '_');
    const localSessions = JSON.parse(localStorage.getItem(lsKey) || '[]');
    const liveMatches   = null;
    const sessions      = localSessions;

    if (sessEl) {
      const prev = sessEl.id;
      sessEl.id  = 'pcSessions';
      renderSessions(sessions, playerName, liveMatches);
      sessEl.id  = prev;
    }

  } catch(e) {
    if (winsEl)   winsEl.textContent   = '—';
    if (lossesEl) lossesEl.textContent = '—';
    if (sessEl)   sessEl.innerHTML     = '<div class="profile-sessions-empty">Could not load sessions.</div>';
  }
}

/* ── Render sessions with PDF-style match history ── */
function renderSessions(sessions, playerName, liveMatches) {
  const container = document.getElementById('pcSessions');
  container.innerHTML = '';

  // liveMatches comes from live_sessions DB (any device) or allRounds (local fallback)
  if (!liveMatches && typeof allRounds !== 'undefined' && allRounds.length) {
    liveMatches = [];
    for (const round of allRounds) {
      const games = round.games || round;
      for (const game of games) {
        if (!game.winner) continue;
        const pair1   = game.pair1 || [];
        const pair2   = game.pair2 || [];
        const leftWon = game.winner === 'L';
        const inPair1 = pair1.some(p => p.toLowerCase() === playerName.toLowerCase());
        const inPair2 = pair2.some(p => p.toLowerCase() === playerName.toLowerCase());
        if (!inPair1 && !inPair2) continue;
        const opponents = inPair1 ? pair2 : pair1;
        const partner   = inPair1 ? pair1.filter(p => p.toLowerCase() !== playerName.toLowerCase())
                                  : pair2.filter(p => p.toLowerCase() !== playerName.toLowerCase());
        liveMatches.push({
          partner,
          partnerGenders:  partner.map(n => getPlayerGender(n)),
          opponents,
          opponentGenders: opponents.map(n => getPlayerGender(n)),
          result: (inPair1 && leftWon) || (inPair2 && !leftWon) ? 'W' : 'L'
        });
      }
    }
  }

  const hasLive = Array.isArray(liveMatches) && liveMatches.length > 0;
  const hasPast = sessions.length > 0;

  if (!hasLive && !hasPast) {
    container.innerHTML = '<div class="profile-sessions-empty">No sessions recorded yet.</div>';
    return;
  }

  // ── Current session ──
  if (hasLive) {
    const liveWins   = liveMatches.filter(m => m.result === 'W').length;
    const liveLosses = liveMatches.filter(m => m.result === 'L').length;
    const rating     = (typeof getActiveRating === 'function') ? getActiveRating(playerName) : getRating(playerName);
    const tier       = ratingTierLabel(rating);

    const block = document.createElement('div');
    block.className = 'session-block';
    block.innerHTML = `
      <div class="session-block-header">
        <div class="session-header-left">
          <span class="session-block-date">Today</span>
          <span class="session-block-rating" style="color:${tier.color}">${rating.toFixed(1)}</span>
        </div>
        <div class="session-header-badges">
          ${liveWins   > 0 ? `<span class="session-badge win">${liveWins}W</span>`   : ''}
          ${liveLosses > 0 ? `<span class="session-badge loss">${liveLosses}L</span>` : ''}
          <span class="session-live-dot">LIVE</span>
        </div>
      </div>
      <div class="session-matches">
        ${liveMatches.map(m => renderMatchRow(m, playerName)).join('<div class="match-divider"></div>')}
      </div>`;
    container.appendChild(block);
  }

  // ── Past sessions ──
  sessions.slice(0, 3).forEach((s, idx) => {
    const tier    = ratingTierLabel(s.rating || 1.0);
    const matches = s.matches || [];

    const block = document.createElement('div');
    block.className = 'session-block past';
    block.innerHTML = `
      <div class="session-block-header" onclick="toggleSessionMatches(this)">
        <div class="session-header-left">
          <span class="session-block-date">${s.date || '—'}</span>
          <span class="session-block-rating" style="color:${tier.color}">${(s.rating || 1.0).toFixed(1)}</span>
        </div>
        <div class="session-header-badges">
          ${s.wins   > 0 ? `<span class="session-badge win">${s.wins}W</span>`   : ''}
          ${s.losses > 0 ? `<span class="session-badge loss">${s.losses}L</span>` : ''}
          ${matches.length ? `<span class="session-chevron">›</span>` : `<span class="session-chevron">›</span>`}
        </div>
      </div>
      ${matches.length ? `
      <div class="session-matches collapsed">
        ${matches.map(m => renderMatchRow(m, playerName)).join('<div class="match-divider"></div>')}
      </div>` : `
      <div class="session-matches collapsed">
        <div class="session-no-matches">Match details available from next session onwards</div>
      </div>`}`;
    container.appendChild(block);
  });
}

function toggleSessionMatches(header) {
  const matchList = header.nextElementSibling;
  if (!matchList) return;
  const isOpen = matchList.classList.toggle('collapsed');
  const chevron = header.querySelector('.session-chevron');
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
}

/* ── Init on load ── */
document.addEventListener('DOMContentLoaded', () => {
  updateProfileBtn();
});
