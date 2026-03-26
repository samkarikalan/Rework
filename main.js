/* ══════════════════════════════════════════════
   MODE SYSTEM — Viewer / Organiser
   Stored in sessionStorage (resets on app close)
══════════════════════════════════════════════ */

var appMode = null; // 'viewer' | 'organiser'

function selectMode(mode) {
  appMode = mode;
  sessionStorage.setItem('appMode', mode);
  localStorage.setItem('kbrr_app_mode', mode);
  // Apply viewer/organiser body classes
  applyMode(mode);
  // Show home screen (defined in HomeScreen.js)
  showHomeScreen();
}

function applyMode(mode) {
  appMode = mode;

  // Body class for organiser scrollable tabs (kept for any CSS that uses it)
  document.body.classList.toggle('organiser-tabs', mode === 'organiser');
  document.body.classList.toggle('vault-mode',     mode === 'vault');

  // Update current mode indicator
  var modeMap = { viewer: {icon:'👁', label:'Viewer'}, organiser: {icon:'🏆', label:'Organiser'}, vault: {icon:'🔑', label:'Vault'} };
  var mi = modeMap[mode] || modeMap['viewer'];
  var iconEl  = document.getElementById('currentModeIcon');
  var labelEl = document.getElementById('currentModeLabel');
  if (iconEl)  iconEl.textContent  = mi.icon;
  if (labelEl) labelEl.textContent = mi.label;

  // Apply viewer restrictions
  if (mode === 'viewer') {
    setViewerMode(true);
  } else {
    if (window._vSessionTabPinned) {
      if (typeof viewerStopPoll === 'function') viewerStopPoll();
      if (typeof _vHidePage     === 'function') _vHidePage();
    }
    setViewerMode(false);
  }
}

function setViewerMode(isViewer) {
  // Use body class — all viewer restrictions handled via CSS + JS checks
  if (isViewer) {
    document.body.classList.add('viewer-mode');
    // Ensure we're on the club tab by default
    // settings no longer has tabs
  } else {
    document.body.classList.remove('viewer-mode');
  }

  // Lock/Unlock toggle button
  const lockBtn = document.getElementById('lockToggleBtn');
  if (lockBtn) {
    lockBtn.style.pointerEvents = isViewer ? 'none' : '';
    lockBtn.style.opacity       = isViewer ? '0.35' : '';
  }

  // New round / control buttons in rounds page
  ['#addRoundBtn', '#removeRoundBtn', '#minRoundsPlus', '#minRoundsMinus'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) { el.style.pointerEvents = isViewer ? 'none' : ''; el.style.opacity = isViewer ? '0.35' : ''; }
  });

  // Import/Add buttons — hide entirely in viewer
  ['#openImportBtn', '.open-import-btn', '#addPlayersTypeBtn', '#addPlayersBrowseBtn'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.display = isViewer ? 'none' : '';
    });
  });
}

/* ============================================================
   UNIFIED MODE + CLUB SHEET
   Single entry point for all mode switching and club login.
   Opened by tapping any mode pill button.
============================================================ */
var _uSheetSelectedMode = null; // mode selected inside the sheet

function openModeSwitcher() {
  const existing = document.getElementById('modeSheetOverlay');
  if (existing) { existing.remove(); return; }

  _uSheetSelectedMode = appMode || 'viewer';
  _renderUnifiedSheet();
}

function _renderUnifiedSheet() {
  const existing = document.getElementById('modeSheetOverlay');
  if (existing) existing.remove();

  const club   = (typeof getMyClub === 'function') ? getMyClub() : null;
  const hasClub = club && club.id;
  const m = _uSheetSelectedMode;

  // Club section — varies by mode
  let clubSection = '';
  if (m === 'viewer') {
    clubSection = `<div class="ums-viewer-note">No club needed — just pick a player to follow in Viewer mode.</div>`;
  } else if (hasClub) {
    const isAdmin = (typeof getClubMode === 'function') ? getClubMode() === 'admin' : localStorage.getItem('kbrr_club_mode') === 'admin';
    const roleTag = isAdmin
      ? `<span class="ums-role-tag admin">Admin</span>`
      : `<span class="ums-role-tag user">User</span>`;
    clubSection = `
      <div class="ums-connected-club">
        <div class="ums-club-row">
          <span class="ums-club-icon">🏢</span>
          <div class="ums-club-info">
            <div class="ums-club-name">${club.name} ${roleTag}</div>
            <div class="ums-club-sub">Connected club</div>
          </div>
        </div>
        ${m === 'vault' && !isAdmin ? `
          <div class="ums-section-label" style="margin-top:12px">Admin password required for Vault</div>
          <input type="password" id="umsVaultPw" class="ums-input" placeholder="Admin password"
                 onkeydown="if(event.key==='Enter')_umsEnter()">
          <div id="umsFeedback" class="ums-feedback"></div>
        ` : `<div id="umsFeedback" class="ums-feedback"></div>`}
        <button class="ums-switch-link" onclick="_umsShowLogin()">Switch club ›</button>
      </div>`;
  } else {
    // No club — show login form
    clubSection = _umsLoginFormHTML(m);
  }

  const modes = [
    { key:'viewer',    icon:'👁',  label:'Viewer',    desc:'Watch live rounds' },
    { key:'organiser', icon:'🏆', label:'Organiser',  desc:'Run sessions' },
    { key:'vault',     icon:'🔑', label:'Vault',      desc:'Club admin' },
  ];

  const modeTabs = modes.map(mo => `
    <button class="ums-mode-tab ${_uSheetSelectedMode === mo.key ? 'active' : ''}"
            onclick="_umsSelectMode('${mo.key}')">
      <span class="ums-tab-icon">${mo.icon}</span>
      <span class="ums-tab-label">${mo.label}</span>
    </button>`).join('');

  let enterLabel = m === 'viewer' ? 'Enter as Viewer'
                 : m === 'vault'  ? 'Enter Vault'
                 : 'Enter as Organiser';

  const overlay = document.createElement('div');
  overlay.id = 'modeSheetOverlay';
  overlay.className = 'mode-sheet-overlay';
  overlay.innerHTML = `
    <div class="ums-sheet" id="umsSheet">
      <div class="mode-sheet-handle"></div>
      <div class="ums-mode-tabs">${modeTabs}</div>
      <div class="ums-divider"></div>
      <div class="ums-club-section" id="umsClubSection">${clubSection}</div>
      <button class="ums-enter-btn" id="umsEnterBtn" onclick="_umsEnter()">${enterLabel} →</button>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  document.getElementById('umsSheet').addEventListener('click', e => e.stopPropagation());

  // Auto-load clubs if login form is visible
  if (document.getElementById('umsClubSelect')) _umsLoadClubs();
}

function _umsLoginFormHTML(mode) {
  const isVault = mode === 'vault';
  return `
    <div class="ums-section-label">Club login</div>
    <select id="umsClubSelect" class="ums-input">
      <option value="">— Loading clubs… —</option>
    </select>
    <input type="password" id="umsPassword" class="ums-input"
           placeholder="${isVault ? 'Admin password' : 'Club password'}"
           onkeydown="if(event.key==='Enter')_umsEnter()">
    <div id="umsFeedback" class="ums-feedback"></div>
    <div class="ums-create-link-row">
      New club? <button class="ums-switch-link" onclick="_umsShowCreate()">Create one ›</button>
    </div>`;
}

function _umsShowLogin() {
  // Show login form even when club connected (switch club)
  const section = document.getElementById('umsClubSection');
  if (section) {
    section.innerHTML = _umsLoginFormHTML(_uSheetSelectedMode);
    _umsLoadClubs();
  }
}

function _umsShowCreate() {
  const section = document.getElementById('umsClubSection');
  if (!section) return;
  section.innerHTML = `
    <div class="ums-section-label">Create a new club</div>
    <input type="text"     id="umsCreateName"    class="ums-input" placeholder="Club name">
    <input type="email"    id="umsCreateEmail"   class="ums-input" placeholder="Your email (OTP verification)">
    <input type="password" id="umsCreateUserPw"  class="ums-input" placeholder="User password">
    <input type="password" id="umsCreateAdminPw" class="ums-input" placeholder="Admin password">
    <div id="umsFeedback" class="ums-feedback"></div>
    <div class="ums-create-link-row">
      <button class="ums-switch-link" onclick="_umsShowLogin()">‹ Back to join</button>
    </div>`;
  const enterBtn = document.getElementById('umsEnterBtn');
  if (enterBtn) { enterBtn.textContent = '📧 Send OTP →'; enterBtn.onclick = _umsSendOtp; }
}

function _umsSelectMode(mode) {
  _uSheetSelectedMode = mode;
  _renderUnifiedSheet();
  // Load clubs if showing login form
  const sel = document.getElementById('umsClubSelect');
  if (sel) _umsLoadClubs();
}

async function _umsLoadClubs() {
  const sel = document.getElementById('umsClubSelect');
  if (!sel) return;
  try {
    const clubs = await sbGet('clubs', 'select=id,name&order=name.asc');
    sel.innerHTML = '<option value="">— Select club —</option>';
    clubs.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      sel.appendChild(o);
    });
  } catch(e) {
    sel.innerHTML = '<option value="">— Could not load clubs —</option>';
  }
}

function _setUmsFb(msg, ok) {
  const fb = document.getElementById('umsFeedback');
  if (fb) { fb.textContent = msg; fb.className = 'ums-feedback ' + (ok ? 'ok' : 'err'); }
}

async function _umsEnter() {
  const m = _uSheetSelectedMode;

  // Viewer — no club needed
  if (m === 'viewer') {
    document.getElementById('modeSheetOverlay')?.remove();
    appMode = 'viewer';
    sessionStorage.setItem('appMode', 'viewer');
    localStorage.setItem('kbrr_app_mode', 'viewer');
    applyMode('viewer');
    if (typeof showHomeScreen === 'function') showHomeScreen();
    return;
  }

  const club = (typeof getMyClub === 'function') ? getMyClub() : null;
  const hasClub = club && club.id;
  const isAdmin = (typeof getClubMode === 'function') ? getClubMode() === 'admin' : localStorage.getItem('kbrr_club_mode') === 'admin';

  // Already connected to club
  if (hasClub) {
    if (m === 'vault' && !isAdmin) {
      // Need admin pw — filter by password server-side (avoids RLS issue reading admin_password column)
      const pw = document.getElementById('umsVaultPw')?.value.trim();
      if (!pw) { _setUmsFb('Enter admin password.', false); return; }
      _setUmsFb('Checking…', true);
      try {
        const rows = await sbGet('clubs', `id=eq.${club.id}&admin_password=eq.${encodeURIComponent(pw)}&select=id`);
        if (!rows?.length) {
          _setUmsFb('Wrong admin password.', false); return;
        }
        localStorage.setItem('kbrr_club_mode', 'admin');
      } catch(e) { _setUmsFb('Error: ' + e.message, false); return; }
    }
    _umsFinishEnter(m);
    return;
  }

  // No club — need to log in via form
  const sel = document.getElementById('umsClubSelect');
  const pwInput = document.getElementById('umsPassword');
  if (!sel || !pwInput) return; // create flow uses its own button

  if (!sel.value) { _setUmsFb('Please select a club.', false); return; }
  const pw = pwInput.value.trim();
  if (!pw) { _setUmsFb('Enter the club password.', false); return; }

  _setUmsFb('Checking…', true);
  try {
    const clubs = await sbGet('clubs', `id=eq.${sel.value}&select=id,name,select_password,admin_password`);
    if (!clubs.length) throw new Error('Club not found.');

    let role = 'user';
    if (pw === clubs[0].admin_password)       { role = 'admin'; }
    else if (pw !== clubs[0].select_password) { throw new Error('Wrong password.'); }

    if (typeof setMyClub === 'function') setMyClub(clubs[0].id, clubs[0].name);
    localStorage.setItem('kbrr_club_mode', role);
    localStorage.setItem('kbrr_rating_field', 'club_ratings');
    pwInput.value = '';

    // Vault needs admin role
    if (m === 'vault' && role !== 'admin') {
      _setUmsFb('Vault requires admin password.', false); return;
    }

    _setUmsFb(role === 'admin' ? '✅ Joined as Admin' : '✅ Joined!', true);
    setTimeout(() => _umsFinishEnter(m), 700);
  } catch(e) { _setUmsFb('❌ ' + e.message, false); }
}

function _umsFinishEnter(mode) {
  document.getElementById('modeSheetOverlay')?.remove();
  if (typeof clubLoginRefresh === 'function') clubLoginRefresh();
  if (typeof syncToLocal === 'function') syncToLocal();
  appMode = mode;
  sessionStorage.setItem('appMode', mode);
  localStorage.setItem('kbrr_app_mode', mode);
  applyMode(mode);
  if (typeof showHomeScreen === 'function') showHomeScreen();
}

// OTP create-club flow (called from sheet's send OTP button)
var _umsCreateEmail = '';
async function _umsSendOtp() {
  const name    = document.getElementById('umsCreateName')?.value.trim();
  const email   = document.getElementById('umsCreateEmail')?.value.trim();
  const userPw  = document.getElementById('umsCreateUserPw')?.value.trim();
  const adminPw = document.getElementById('umsCreateAdminPw')?.value.trim();
  if (!name)                        { _setUmsFb('Enter club name.', false); return; }
  if (!email || !email.includes('@')){ _setUmsFb('Enter a valid email.', false); return; }
  if (!userPw)                      { _setUmsFb('Enter user password.', false); return; }
  if (!adminPw)                     { _setUmsFb('Enter admin password.', false); return; }
  _setUmsFb('Sending OTP…', true);
  try {
    // Cache values for step 2
    document.getElementById('umsCreateName')._sv    = name;
    document.getElementById('umsCreateUserPw')._sv  = userPw;
    document.getElementById('umsCreateAdminPw')._sv = adminPw;
    await dbSendOtp(email);
    _umsCreateEmail = email;
    const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1…$2');
    const section = document.getElementById('umsClubSection');
    if (section) section.innerHTML = `
      <div class="ums-section-label">Verify OTP</div>
      <div class="ums-otp-hint">OTP sent to <strong>${maskedEmail}</strong></div>
      <input type="text" id="umsOtp" class="ums-input" placeholder="8-digit OTP" maxlength="8"
             onkeydown="if(event.key==='Enter')_umsVerifyOtp()">
      <div id="umsFeedback" class="ums-feedback"></div>`;
    const btn = document.getElementById('umsEnterBtn');
    if (btn) { btn.textContent = 'Create Club →'; btn.onclick = _umsVerifyOtp; }
  } catch(e) { _setUmsFb('❌ ' + e.message, false); }
}

async function _umsVerifyOtp() {
  const otp     = document.getElementById('umsOtp')?.value.trim();
  const name    = document.getElementById('umsCreateName')?._sv;
  const userPw  = document.getElementById('umsCreateUserPw')?._sv;
  const adminPw = document.getElementById('umsCreateAdminPw')?._sv;
  if (!otp || otp.length < 6) { _setUmsFb('Enter the OTP.', false); return; }
  _setUmsFb('Creating club…', true);
  try {
    await dbVerifyOtp(_umsCreateEmail, otp);
    const club = await dbAddClub(name, userPw, adminPw, _umsCreateEmail);
    if (typeof setMyClub === 'function') setMyClub(club.id, club.name);
    localStorage.setItem('kbrr_club_mode', 'admin');
    localStorage.setItem('kbrr_rating_field', 'club_ratings');
    _setUmsFb(`✅ Club "${club.name}" created!`, true);
    setTimeout(() => _umsFinishEnter(_uSheetSelectedMode), 800);
  } catch(e) { _setUmsFb('❌ ' + e.message, false); }
}

function switchMode(mode) {
  // Route everything through the unified sheet
  _uSheetSelectedMode = mode || appMode || 'viewer';
  openModeSwitcher();
}

function initModeOnLoad() {
  // Keep home hidden
  var homeEl = document.getElementById('homePageOverlay');
  if (homeEl) homeEl.style.display = 'none';
  // Run smart startup flow
  initAppFlow();
}

async function initAppFlow() {
  // Always show mode select on fresh load
  localStorage.removeItem('kbrr_app_mode');
  sessionStorage.removeItem('appMode');
  // ── Step 1: Check auth ──
  if (typeof authIsLoggedIn === 'function' && !authIsLoggedIn()) {
    authShowScreen('welcome');
    return;
  }

  // ── Step 2: No saved mode — open unified sheet (viewer pre-selected) ──
  var savedMode = localStorage.getItem('kbrr_app_mode') || sessionStorage.getItem('appMode') || '';
  if (!savedMode) {
    _uSheetSelectedMode = 'viewer';
    _renderUnifiedSheet();
    return;
  }

  // Vault requires admin auth, downgrade if needed
  if (savedMode === 'vault' && localStorage.getItem('kbrr_club_mode') !== 'admin') {
    savedMode = 'viewer';
  }

  // ── Step 3: Check club for organiser/vault ──
  var club = (typeof getMyClub === 'function') ? getMyClub() : { id: null };

  if (!club || !club.id) {
    if (savedMode === 'viewer') {
      selectMode('viewer');
      return;
    }
    // Organiser or vault without club — open unified sheet
    _uSheetSelectedMode = savedMode;
    _renderUnifiedSheet();
    _umsLoadClubs();
    return;
  }

  // ── Step 4: Check players (organiser only) ──
  if (savedMode === 'organiser') {
    try {
      var players = await dbGetPlayers(true);
      if (!players || players.length === 0) {
        showOnboardingOverlay('noPlayers');
        return;
      }
    } catch(e) {}
  }

  // ── All good — show home ──
  selectMode(savedMode);
}

function showOnboardingOverlay(reason) {
  var overlay = document.getElementById('onboardingOverlay');
  var title   = document.getElementById('onboardingTitle');
  var msg     = document.getElementById('onboardingMsg');
  var btn     = document.getElementById('onboardingBtn');
  if (!overlay) return;

  var goToVault = function() {
    overlay.style.display = 'none';
    // Hide home overlay if visible
    var homeEl = document.getElementById('homePageOverlay');
    if (homeEl) homeEl.style.display = 'none';
    // Show vault page
    showPage('vaultPage', null);
  };

  if (reason === 'notLoggedIn') {
    if (title) title.textContent = 'Welcome to Sports Club Scheduler';
    if (msg)   msg.textContent   = 'Connect to your club to get started.';
    if (btn)   { btn.textContent = 'Connect to Club'; btn.onclick = goToVault; }
  } else if (reason === 'noPlayers') {
    if (title) title.textContent = 'No players found';
    if (msg)   msg.textContent   = 'Your club has no players yet. Add players in the Vault to get started.';
    if (btn)   { btn.textContent = 'Go to Vault'; btn.onclick = goToVault; }
  }
  overlay.style.display = 'flex';
}

/* ============================================================
   MAIN — Navigation, tab access, scheduler init, round progression
   File: main.js
   ============================================================ */

let sessionFinished = false;
let lastPage = null;



function isPageVisible(pageId) {
  const el = document.getElementById(pageId);
  return el && el.style.display !== 'none';
}








document.addEventListener('DOMContentLoaded', () => {
  // Show mode select overlay first
  initModeOnLoad();

  // schedulerState starts empty — user imports players fresh each session
  consolidateMasterDB();
  updateRoundsPageAccess();
  updateSummaryPageAccess();
  // Init Supabase admin state (token + club)
  if (typeof clubAdminInit === "function") clubAdminInit();
  // Sync Supabase players into local history (silent, background)
  syncToLocal();
  // Sync all global players into local cache (for offline import)
  if (typeof syncGlobalPlayersCache === "function") syncGlobalPlayersCache();
  // Clean up stale live_sessions from previous days
  if (typeof cleanupLiveSessions === "function") cleanupLiveSessions();

  // ── Profile gate handled by selectMode() after mode is chosen ──

  // Auto end session if no round activity for 1 hour
  const AUTO_END_MS = 60 * 60 * 1000; // 1 hour
  setInterval(async () => {
    // Only trigger if there are active rounds with scored games
    const hasGames = typeof allRounds !== "undefined" &&
      allRounds.some(r => (r.games || r).some(g => g.winner));
    if (!hasGames) return;

    // Check last round update time from live_sessions
    try {
      const club = (typeof getMyClub === "function") ? getMyClub() : { id: null };
      if (!club.id) return;
      const today = new Date().toISOString().split("T")[0];
      const rows  = await sbGet("live_sessions",
        `club_id=eq.${club.id}&date=eq.${today}&order=updated_at.desc&limit=1`);
      if (!rows || !rows.length) return;

      const lastUpdate = new Date(rows[0].updated_at).getTime();
      if (Date.now() - lastUpdate < AUTO_END_MS) return;

      // 1hr idle — silently end session
      console.log("Auto-ending session after 1hr idle");
      if (typeof dbCompleteSession === "function") await dbCompleteSession();
      if (typeof flushLiveSession === "function") await flushLiveSession();
      if (typeof dbReleaseMySession === "function") await dbReleaseMySession();
      localStorage.removeItem("schedulerState");
      localStorage.removeItem("allRounds");
      localStorage.removeItem("currentRoundIndex");
      location.reload();
    } catch(e) { /* silent */ }
  }, 5 * 60 * 1000); // check every 5 minutes
});

window.addEventListener('beforeunload', () => {
  consolidateMasterDB();   // merge any new players added during session on close
  if (typeof dbCompleteSession === "function") dbCompleteSession();
  if (typeof dbReleaseMySession === "function") dbReleaseMySession();
});

/* =========================
   CONSOLIDATE MASTER DB
   Merges players from ALL sources into newImportHistory.
   Safe — never overwrites existing ratings, only adds missing players.
   Called on app open and close.
========================= */
function consolidateMasterDB() {
  try {
    const master   = JSON.parse(localStorage.getItem("newImportHistory")      || "[]");
    const favs     = JSON.parse(localStorage.getItem("newImportFavorites")     || "[]");
    const sets     = JSON.parse(localStorage.getItem("newImportFavoriteSets")  || "[]");
    const session  = JSON.parse(localStorage.getItem("schedulerPlayers")       || "[]");

    // Build lookup of existing master players (preserve their ratings)
    const masterMap = new Map();
    master.forEach(p => {
      if (p && p.displayName)
        masterMap.set(p.displayName.trim().toLowerCase(), p);
    });

    // Collect players from favorites and session only — NOT from sets
    // Sets are separate and should not pollute history
    const allSources = [
      ...favs,
      ...session.map(p => ({ displayName: p.name, gender: p.gender })),
    ];

    // Add missing players — never overwrite existing
    allSources.forEach(p => {
      if (!p || !p.displayName) return;
      const key = p.displayName.trim().toLowerCase();
      if (!masterMap.has(key)) {
        masterMap.set(key, {
          displayName: p.displayName.trim(),
          gender: p.gender || "Male",
          rating: 1.0   // default for new players only
        });
      }
    });

    const merged = Array.from(masterMap.values());
    localStorage.setItem("newImportHistory", JSON.stringify(merged));

    // Update in-memory historyPlayers if available
    if (newImportState) newImportState.historyPlayers = merged;
  } catch(e) {
    console.error("consolidateMasterDB error", e);
  }
}

/* ============================================================
   RATING — SINGLE DOOR
   
   Rule: activeRating is computed ONCE at sync time in syncToLocal.
   Everything else reads newImportHistory[].activeRating — mode-blind.

   getActiveRating(name)     — only READ path
   setActiveRating(name,val) — only WRITE path (in-memory + localStorage)
   syncRatings()             — refreshes all visible badges
   
   Mode logic lives ONLY in syncToLocal (read) and dbSyncRatings (write).
   ============================================================ */

function getRatingMode() {
  return 'local'; // global mode blocked until fully tested
}

function setRatingMode(mode) {
  localStorage.setItem('kbrr_rating_mode', mode);
  syncRatings();
}

/* READ — just reads activeRating, no mode logic here */
function getActiveRating(name) {
  try {
    const key = name.trim().toLowerCase();
    // 1. Check allPlayers in-memory first (most current during active session)
    const ap = schedulerState.allPlayers.find(p => p.name.trim().toLowerCase() === key);
    if (ap && ap.activeRating !== undefined) return ap.activeRating;
    // 2. Fallback to newImportHistory
    const master = JSON.parse(localStorage.getItem("newImportHistory") || "[]");
    const hp = master.find(h => h.displayName.trim().toLowerCase() === key);
    return (hp && hp.activeRating !== undefined) ? hp.activeRating : 1.0;
  } catch(e) { return 1.0; }
}

/* WRITE — updates in-memory and localStorage, mode-blind */
function setActiveRating(name, val) {
  try {
    const key     = name.trim().toLowerCase();
    const clamped = Math.min(5.0, Math.max(1.0, Math.round(val * 10) / 10));

    // Update allPlayers in-memory
    const ap = schedulerState.allPlayers.find(p => p.name.trim().toLowerCase() === key);
    if (ap) ap.activeRating = clamped;

    // Persist to newImportHistory
    const master = JSON.parse(localStorage.getItem("newImportHistory") || "[]");
    const hp = master.find(h => h.displayName.trim().toLowerCase() === key);
    if (hp) {
      hp.activeRating = clamped;
      localStorage.setItem("newImportHistory", JSON.stringify(master));
      // Keep in-memory historyPlayers in sync too
      if (newImportState && newImportState.historyPlayers) {
        const mp = newImportState.historyPlayers.find(h => h.displayName.trim().toLowerCase() === key);
        if (mp) mp.activeRating = clamped;
      }
    }
  } catch(e) { console.error("setActiveRating error", e); }
}

/* Legacy aliases — safe to leave, all point to same door */
function getRating(name)         { return getActiveRating(name); }
function setRating(name, rating) { setActiveRating(name, rating); }
function getClubRating(name)     { return getActiveRating(name); }
function setClubRating(name, r)  { setActiveRating(name, r); }

function syncRatings() {
  document.querySelectorAll(".rating-badge[data-player]").forEach(badge => {
    const name = badge.getAttribute("data-player");
    if (name) badge.textContent = getActiveRating(name).toFixed(1);
  });
}

function syncPlayersFromMaster() { syncRatings(); }


function updateRoundsPageAccess() {
  const block = schedulerState.activeplayers.length < 4;
  const roundsTab = document.getElementById('tabBtnRounds');

  if (!roundsTab) return;

  roundsTab.style.pointerEvents = block ? 'none' : 'auto';
  roundsTab.style.opacity = block ? '0.4' : '1';
  roundsTab.setAttribute('aria-disabled', block);

  if (block && isPageVisible('roundsPage')) {
    showPage('playersPage', null);
  }
}


function updateSummaryPageAccess() {
  const hasRounds = Array.isArray(allRounds) && allRounds.length > 0;
  const summaryTab = document.getElementById('tabBtnSummary');
  const block = !hasRounds;

  if (!summaryTab) return;

  summaryTab.style.pointerEvents = block ? 'none' : 'auto';
  summaryTab.style.opacity = block ? '0.4' : '1';
  summaryTab.setAttribute('aria-disabled', block);

  if (block && isPageVisible('summaryPage')) {
    showPage('playersPage', null);
  }
}

function showPage(pageID, el) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  // Show selected page
  document.getElementById(pageID).style.display = 'block';

  // Update active tab styling
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (el) {
    el.classList.add('active');
    // Scroll active tab into view smoothly
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Restore Session tab if a session is currently pinned open
  if (window._vSessionTabPinned) {
    const vBtn = document.getElementById('tabBtnViewer');
    if (vBtn) vBtn.style.display = '';
  }

  // Sync all rating badges on the newly visible page
  syncRatings();

  // Players page — update list on open
  if (pageID === 'playersPage') {
    if (typeof updatePlayerList === 'function') updatePlayerList();
  }

  // Fixed Pairs page — refresh selectors on open
  if (pageID === 'fixedPairsPage') {
    if (typeof updateFixedPairSelectors === 'function') updateFixedPairSelectors();
    if (typeof renderFixedPairs === 'function') renderFixedPairs();
  }

  // ➜ Additional action when roundsPage is opened
  if (pageID === "roundsPage") {
    if (sessionFinished) {
      console.warn("Rounds already finished");
      return;
    }
    updateMixedSessionFlag();
    if (allRounds.length <= 1) {
      resetRounds();
    } else {
      if (lastPage === "playersPage") {
        goToRounds();
      }
    }
  }

  if (pageID === "summaryPage") {
    if (typeof renderSummaryFromSession === 'function') renderSummaryFromSession();
  }

  if (pageID === "myCardPage") {
    if (typeof renderMyCard === 'function') renderMyCard();
  }

  if (pageID === "joinClubPage") {
    if (typeof joinClubPageOpen === 'function') joinClubPageOpen();
  }

  if (pageID === "helpPage") {
    if (typeof onHelpTabOpen === "function") onHelpTabOpen();
  }

  if (pageID === "dashboardPage") {
    if (typeof renderDashboard === "function") renderDashboard();
  } else {
    // Stop dashboard poll when navigating away
    if (typeof dashboardStopPoll === 'function') dashboardStopPoll();
  }

  if (pageID === "vaultPage") {
    if (typeof clubLoginRefresh === 'function') clubLoginRefresh();
    if (typeof viewerLoadClubs === 'function') viewerLoadClubs();
    if (typeof sbPopulateDeleteDropdown === 'function') sbPopulateDeleteDropdown();
  }

  if (pageID === "vaultPlayingPage") {
    if (typeof playerPlayingRenderList === 'function') playerPlayingRenderList();
  }

  if (pageID === "vaultRegisterPage") {
    if (typeof vaultRenderRegister === 'function') vaultRenderRegister();
  }

  if (pageID === "vaultModifyPage") {
    if (typeof vaultRenderModify === 'function') vaultRenderModify();
  }

  if (pageID === "vaultRequestsPage") {
    if (typeof vaultLoadRequests === 'function') vaultLoadRequests();
  }

  if (pageID === "vaultClubMgmtPage") {
    if (typeof clubLoginRefresh === 'function') clubLoginRefresh();
    if (typeof viewerLoadClubs === 'function') viewerLoadClubs();
    if (typeof sbPopulateDeleteDropdown === 'function') sbPopulateDeleteDropdown();
  }

  // Update last visited page
  lastPage = pageID;
}

let IS_MIXED_SESSION = false;

function updateMixedSessionFlag() {
  let hasMale = false;
  let hasFemale = false;

  for (const p of schedulerState.allPlayers) {
    if (p.gender === "Male") hasMale = true;
    if (p.gender === "Female") hasFemale = true;
    if (hasMale && hasFemale) break;
  }

  IS_MIXED_SESSION = hasMale && hasFemale;
}

	





















  








// Page initialization
function initPage() {
  document.getElementById("playersPage").style.display = 'block';
  document.getElementById("roundsPage").style.display = 'none';
}

/* ============================================================
   SYNC — Server is master.
   THIS is the only place mode logic runs for READING.
   Pulls from Supabase → picks correct field based on mode → 
   writes as activeRating → everything else is mode-blind.
============================================================ */
async function syncToLocal() {
  const club = (typeof getMyClub === "function") ? getMyClub() : { id: null };
  setSyncIndicator("🔄 Syncing...", "#aaa");

  if (!club.id) {
    setSyncIndicator("⚠️ No club selected", "#e6a817");
    return;
  }

  try {
    // Flush any offline-queued writes first
    if (typeof flushSyncQueue === "function") await flushSyncQueue();

    const players = await dbGetPlayers(true);
    if (!players || !players.length) {
      setSyncIndicator("⚠️ No players found", "#e6a817");
      return;
    }

    // Always use clubRating (club_rating column) as the active rating
    const synced = players.map(gp => {
      const activeRating = parseFloat(gp.clubRating) || parseFloat(gp.rating) || 1.0;
      return {
        displayName:  gp.name.trim(),
        gender:       gp.gender || "Male",
        rating:       parseFloat(gp.rating)     || 1.0,
        clubRating:   parseFloat(gp.clubRating) || 1.0,
        activeRating,
        id:           gp.id
      };
    });

    // Server wins — write to local cache
    localStorage.setItem("newImportHistory", JSON.stringify(synced));

    // Update in-memory state
    if (newImportState) {
      newImportState.historyPlayers = synced;
      if (typeof newImportRefreshSelectCards === "function") newImportRefreshSelectCards();
    }

    // Update allPlayers in-memory activeRating (safe — doesn't reset active session games)
    if (schedulerState && schedulerState.allPlayers) {
      synced.forEach(sp => {
        const ap = schedulerState.allPlayers.find(
          p => p.name.trim().toLowerCase() === sp.displayName.trim().toLowerCase()
        );
        if (ap) ap.activeRating = sp.activeRating;
      });
    }

    syncRatings();

    const count = synced.length;
    const msg   = `✅ ${count} player${count !== 1 ? "s" : ""} synced · ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    localStorage.setItem("kbrr_last_sync", JSON.stringify({ msg, color: "#2dce89" }));
    setSyncIndicator(msg, "#2dce89");

  } catch (e) {
    console.warn("syncToLocal failed:", e.message);
    const msg = "⚠️ Offline — using cache";
    localStorage.setItem("kbrr_last_sync", JSON.stringify({ msg, color: "#e6a817" }));
    setSyncIndicator(msg, "#e6a817");
  }
}

function setSyncIndicator(msg, color) {
  const indicator = document.getElementById("sbSyncStatus");
  if (indicator) { indicator.textContent = msg; indicator.style.color = color; }
}

function restoreSyncIndicator() {
  try {
    const saved = localStorage.getItem("kbrr_last_sync");
    if (saved) {
      const { msg, color } = JSON.parse(saved);
      setSyncIndicator(msg, color);
    }
  } catch(e) {}
}



/* =============================================================
   VAULT MODE — Admin password gate
============================================================= */
function requestVaultMode() {
  _uSheetSelectedMode = 'vault';
  openModeSwitcher();
}

/* =============================================================
   LEGACY STUBS — replaced by unified sheet (_umsEnter etc.)
============================================================= */
var _clubSetupTargetMode = null;
var _clubSetupCreateEmail = '';

/* =============================================================
   POWER BUTTON — End Session
============================================================= */
async function endSession(fromProfile = false) {
  if (!confirm('End session?')) return;

  // Mark session completed in sessions table
  if (typeof dbCompleteSession === 'function') await dbCompleteSession();

  // Flush live_sessions → players.sessions, then delete temp rows
  if (typeof flushLiveSession === 'function') await flushLiveSession();

  // Release session slots
  if (typeof dbReleaseMySession === 'function') await dbReleaseMySession();

  // Clear local session state — no reload
  localStorage.removeItem('schedulerState');
  localStorage.removeItem('allRounds');
  localStorage.removeItem('currentRoundIndex');
  sessionStorage.removeItem('kbrr_session_db_id');

  // Reset in-memory state
  if (typeof allRounds !== 'undefined') allRounds.length = 0;
  if (typeof schedulerState !== 'undefined') {
    schedulerState.activeplayers = [];
    schedulerState.allPlayers    = [];
    if (schedulerState.winCount)    schedulerState.winCount.clear();
    if (schedulerState.PlayedCount) schedulerState.PlayedCount.clear();
    if (schedulerState.restCount)   schedulerState.restCount.clear();
  }

  // Stay on dashboard and refresh it
  if (typeof showPage === 'function') {
    showPage('dashboardPage', document.getElementById('tabBtnDashboard'));
  }
}

/* === SETTINGS TAB SWITCHER === */
function settingsShowTab(tab) {
  ["club","general"].forEach(t => {
    const el = document.getElementById("settingsTab" + t.charAt(0).toUpperCase() + t.slice(1));
    if (el) el.style.display = t === tab ? "" : "none";
    const btn = document.getElementById("settingsTab" + t.charAt(0).toUpperCase() + t.slice(1) + "Btn");
    if (btn) btn.classList.toggle("active", t === tab);
  });
}

// Close fixed pair picker on outside click
document.addEventListener("click", function(e) {
  if (typeof fpOpenPicker !== "undefined" && fpOpenPicker !== null) {
    if (!e.target.closest(".fp-picker-field") && !e.target.closest(".fp-dropdown")) {
      fpClosePicker(fpOpenPicker);
    }
  }
});

