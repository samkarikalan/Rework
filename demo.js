/* ============================================================
   DEMO MODULE — Step-by-step video-style slideshow
   File: demo.js
   Triggered from: Help page ("Watch Demo" button)
   Covers: Viewer, Organiser, Vault roles
   ============================================================ */

/* ── Slide data ─────────────────────────────────────────────── */

var DEMO_ROLES = [
  {
    key:   'viewer',
    label: 'Viewer',
    icon:  '👁',
    color: 'rgba(108,140,255,0.18)',
    border:'rgba(108,140,255,0.4)',
    slides: [
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-pill" style="background:rgba(108,140,255,0.15);color:#6c8cff;">👁 Viewer Mode</div>
          <div class="demo-scene-title">Watch live sessions</div>
          <div class="demo-scene-sub">Follow any club session in real time</div>
          <div style="display:flex;gap:10px;margin-top:12px;width:100%;">
            <div class="demo-vhome-tile">
              <div style="font-size:1.3rem;">👤</div>
              <div class="demo-vhome-name">My Card</div>
            </div>
            <div class="demo-vhome-tile">
              <div style="font-size:1.3rem;">📡</div>
              <div class="demo-vhome-name">Dashboard</div>
            </div>
          </div>
        </div>`,
        title: 'Viewer Home Screen',
        desc:  'When you log in as a Viewer you see two main tiles — "My Card" to view your player profile and club rating, and "Dashboard" to find and watch live sessions. A "My Clubs" expandable tile below lets you connect to clubs.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:6px;align-self:flex-start;">🏢 My Clubs</div>
          <div class="demo-vclub-tile">
            <div style="display:flex;align-items:center;gap:10px;flex:1;">
              <div class="demo-vclub-dot"></div>
              <div>
                <div style="font-size:0.88rem;font-weight:700;color:var(--text);">Tokyo Badminton Club</div>
                <div style="margin-top:3px;">
                  <span class="demo-role-badge">SESSION</span>
                </div>
              </div>
            </div>
            <div class="demo-btn-mock" style="font-size:0.72rem;padding:5px 12px;">Change</div>
          </div>
          <div class="demo-scene-sub" style="margin-top:10px;">Select your club from the list and enter the member password, then tap Join</div>
        </div>`,
        title: 'Connect to Your Club',
        desc:  'Tap the "My Clubs" tile on the home screen. Select your club from the dropdown, enter the member password provided by your organiser, and tap Join. Your connected club appears with a SESSION badge.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:6px;align-self:flex-start;">📡 Dashboard</div>
          <div class="demo-vdash-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <div style="font-size:0.85rem;font-weight:700;color:var(--text);">Tokyo Badminton Club</div>
              <div class="demo-live-badge"><div class="demo-live-dot"></div>LIVE</div>
            </div>
            <div style="display:flex;gap:12px;font-size:0.75rem;color:var(--text-dim);margin-bottom:8px;">
              <span>👥 8 players</span>
              <span>🔄 3 rounds</span>
              <span>▶ Kari</span>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              <div class="demo-pchip">Ali</div>
              <div class="demo-pchip">Sam</div>
              <div class="demo-pchip demo-pchip-me">Kari ★</div>
              <div class="demo-pchip">Jay</div>
              <div class="demo-pchip demo-pchip-more">+4</div>
            </div>
          </div>
          <div class="demo-scene-sub" style="margin-top:8px;">Tap a LIVE card to open that session</div>
        </div>`,
        title: 'Find a Live Session',
        desc:  'Tap the "Dashboard" tile to see all sessions for your club. Live sessions show a pulsing LIVE badge along with the organiser name, player count, and how many rounds have been played. Tap the card to enter the viewer.',
      },
      {
        visual: `<div class="demo-visual-scene" style="gap:5px;">
          <div style="display:flex;width:100%;border-bottom:1px solid var(--border);margin-bottom:6px;">
            <div class="demo-vtab active">🏸 Live</div>
            <div class="demo-vtab">📊 Summary</div>
          </div>
          <div class="demo-vinfo-bar">
            <div class="demo-vinfo-dot"></div>
            <span><strong>Tokyo Badminton Club</strong> · Kari · 32m</span>
          </div>
          <div class="demo-vround-hdr">Round 3</div>
          <div class="demo-vcourtcard">
            <div class="demo-vcourtname">Court 1</div>
            <div class="demo-vteams">
              <div class="demo-vteam">Ali<br>Sam</div>
              <div class="demo-vvs">VS</div>
              <div class="demo-vteam">Jay<br>Kim</div>
            </div>
          </div>
          <div class="demo-vcourtcard">
            <div class="demo-vcourtname">Court 2</div>
            <div class="demo-vteams">
              <div class="demo-vteam">Mia<br>Leo</div>
              <div class="demo-vvs">VS</div>
              <div class="demo-vteam">Zoe<br>Max</div>
            </div>
          </div>
          <div style="font-size:0.72rem;color:var(--text-dim);padding:2px 4px;">Sitting out: Kari</div>
        </div>`,
        title: 'Live Tab — Current Round',
        desc:  'The Live tab shows the current round with all courts and their matchups. The info bar at the top shows the club name, who started the session, and elapsed time. The view polls automatically every 5 seconds for updates — no manual refresh needed.',
      },
      {
        visual: `<div class="demo-visual-scene" style="gap:5px;">
          <div style="display:flex;width:100%;border-bottom:1px solid var(--border);margin-bottom:6px;">
            <div class="demo-vtab">🏸 Live</div>
            <div class="demo-vtab active">📊 Summary</div>
          </div>
          <div class="demo-vreport-hdr">
            <span></span><span>Rank</span><span>Name</span><span>W</span><span>P</span><span>R</span>
          </div>
          <div class="demo-vplayer-row" style="--strip:#f5a623;">
            <div class="demo-vstrip"></div>
            <span style="color:#f5a623;font-weight:800;">#1</span>
            <span style="font-weight:700;">Ali</span>
            <span style="color:#2dce89;font-weight:700;">5</span><span>6</span><span style="color:var(--text-dim);">1</span>
          </div>
          <div class="demo-vplayer-row" style="--strip:#9b9b9b;">
            <div class="demo-vstrip"></div>
            <span style="color:#9b9b9b;font-weight:700;">#2</span>
            <span style="font-weight:700;">Sam</span>
            <span style="color:#2dce89;font-weight:700;">4</span><span>6</span><span style="color:var(--text-dim);">0</span>
          </div>
          <div class="demo-vplayer-row" style="--strip:#cd7f32;">
            <div class="demo-vstrip"></div>
            <span style="color:#cd7f32;font-weight:700;">#3</span>
            <span style="font-weight:700;">Jay</span>
            <span style="color:#2dce89;font-weight:700;">3</span><span>5</span><span style="color:var(--text-dim);">2</span>
          </div>
        </div>`,
        title: 'Summary Tab — Leaderboard & History',
        desc:  'Switch to the Summary tab to see the session leaderboard sorted by Wins (W), with Games Played (P) and Resting (R) shown alongside. All previous rounds are listed below the leaderboard so you can review every matchup from the session.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div style="font-size:2.8rem;margin-bottom:10px;">✅</div>
          <div class="demo-scene-title">You are all set!</div>
          <div class="demo-scene-sub" style="max-width:260px;">Home → My Clubs → Dashboard → Live tab → Summary tab</div>
        </div>`,
        title: 'Viewer — All Done!',
        desc:  'That covers the full Viewer journey: connect to a club via My Clubs, open Dashboard to find the live session, watch courts on the Live tab, and check standings on the Summary tab. Try another role or close to return to Help.',
      },
    ],
  },

  {
    key:   'organiser',
    label: 'Organiser',
    icon:  '🏆',
    color: 'rgba(45,206,137,0.15)',
    border:'rgba(45,206,137,0.4)',
    slides: [
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-pill" style="background:rgba(45,206,137,0.2);color:#2dce89;">🏆 Organiser Mode</div>
          <div class="demo-scene-title">Run your session</div>
          <div class="demo-scene-sub">Schedule rounds · Enter scores · Manage players</div>
        </div>`,
        title: 'What is Organiser Mode?',
        desc:  'Organiser mode is for the person running the badminton session. You start a session, add players, generate fair rounds, record scores, and close the session when done.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-card" style="margin-bottom:10px;">
            <div class="demo-scene-label">Select Club</div>
            <div class="demo-input-mock">🏟 Tokyo Badminton Club ▾</div>
          </div>
          <div class="demo-btn-mock">▶ Start Session</div>
          <div class="demo-scene-sub" style="margin-top:10px;">Only one active session per club at a time</div>
        </div>`,
        title: 'Start a Session',
        desc:  'Tap "Organiser" on the home screen, select your club, and tap "Start Session". This opens the session and lets viewers join. Only one session can be active per club at a time.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:8px;">Players</div>
          <div class="demo-player-list">
            <div class="demo-player-row"><span class="demo-avatar" style="background:#6c8cff;">A</span><span>Ali</span><span class="demo-tag active">Playing</span></div>
            <div class="demo-player-row"><span class="demo-avatar" style="background:#2dce89;">S</span><span>Sam</span><span class="demo-tag active">Playing</span></div>
            <div class="demo-player-row"><span class="demo-avatar" style="background:#ff6584;">Z</span><span>Zoe</span><span class="demo-tag rest">Resting</span></div>
          </div>
          <div class="demo-btn-mock" style="margin-top:10px;">＋ Add Player</div>
        </div>`,
        title: 'Add Players to the Session',
        desc:  'On the Players page, tap "Add Player" to mark club members as active for this session. Toggle each player between Playing and Resting using the play button next to their name.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:8px;">Round 3 — 3 Courts</div>
          <div class="demo-court-card" style="width:100%;margin-bottom:8px;">
            <div class="demo-court-num">Court 1</div>
            <div class="demo-court-match">Ali &amp; Sam &nbsp;<span style="color:var(--text-dim)">vs</span>&nbsp; Jay &amp; Kim</div>
          </div>
          <div class="demo-court-card" style="width:100%;margin-bottom:8px;">
            <div class="demo-court-num">Court 2</div>
            <div class="demo-court-match">Mia &amp; Leo &nbsp;<span style="color:var(--text-dim)">vs</span>&nbsp; Zoe &amp; Max</div>
          </div>
          <div class="demo-btn-mock">⚡ Generate Next Round</div>
        </div>`,
        title: 'Generate Rounds Automatically',
        desc:  'Go to the Rounds page and tap "Generate Next Round". The algorithm pairs players fairly based on rating and play history — trying to ensure everyone plays with and against different people each round.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:8px;">Enter Result — Court 1</div>
          <div class="demo-score-entry">
            <div class="demo-score-team">
              <div class="demo-score-name">Ali &amp; Sam</div>
              <div class="demo-score-input-mock">21</div>
            </div>
            <div style="color:var(--text-dim);font-size:1.1rem;align-self:center;">–</div>
            <div class="demo-score-team">
              <div class="demo-score-name">Jay &amp; Kim</div>
              <div class="demo-score-input-mock">15</div>
            </div>
          </div>
          <div class="demo-btn-mock" style="margin-top:10px;">✓ Save Result</div>
        </div>`,
        title: 'Record Game Results',
        desc:  'Tap a court card to open the score entry screen. Enter the score for each team and tap Save. Results update player ratings and appear immediately on the Viewer scoreboard.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div style="font-size:2.8rem;margin-bottom:10px;">🏅</div>
          <div class="demo-scene-title">Session complete!</div>
          <div class="demo-scene-sub">Summary → ratings updated → session closed</div>
        </div>`,
        title: 'Organiser — All Done!',
        desc:  'When all rounds are finished, go to the Summary page to review results, then close the session. Player ratings update automatically and the session is stored in your club history.',
      },
    ],
  },

  {
    key:   'vault',
    label: 'Vault',
    icon:  '🔒',
    color: 'rgba(245,166,35,0.15)',
    border:'rgba(245,166,35,0.4)',
    slides: [
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-pill" style="background:rgba(245,166,35,0.2);color:#f5a623;">🔒 Vault Mode</div>
          <div class="demo-scene-title">Full admin control</div>
          <div class="demo-scene-sub">Clubs · Members · Settings · Subscription</div>
        </div>`,
        title: 'What is Vault Mode?',
        desc:  'Vault mode is the admin layer of the app. As Vault manager you create and configure clubs, manage the full member roster, control court settings, and handle subscription and app-wide preferences.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-card" style="margin-bottom:8px;">
            <div class="demo-scene-label">Club Name</div>
            <div class="demo-input-mock">Tokyo Badminton Club</div>
          </div>
          <div class="demo-scene-card" style="margin-bottom:8px;">
            <div class="demo-scene-label">Courts Available</div>
            <div class="demo-input-mock">4 ▾</div>
          </div>
          <div class="demo-btn-mock">＋ Create Club</div>
        </div>`,
        title: 'Create a Club',
        desc:  'In Vault, tap "Create Club" and fill in the club name and number of courts. A unique club code is generated automatically — share this with members so they can join as Viewer or Organiser.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:8px;">Member Roster</div>
          <div class="demo-player-list">
            <div class="demo-player-row"><span class="demo-avatar" style="background:#6c8cff;">A</span><span>Ali</span><span class="demo-tag" style="background:rgba(108,140,255,0.2);color:#6c8cff;">★ 1450</span></div>
            <div class="demo-player-row"><span class="demo-avatar" style="background:#2dce89;">S</span><span>Sam</span><span class="demo-tag" style="background:rgba(45,206,137,0.2);color:#2dce89;">★ 1380</span></div>
            <div class="demo-player-row"><span class="demo-avatar" style="background:#ff6584;">Z</span><span>Zoe</span><span class="demo-tag" style="background:rgba(255,101,132,0.2);color:#ff6584;">★ 1310</span></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <div class="demo-btn-mock" style="flex:1;font-size:0.75rem;">＋ Add</div>
            <div class="demo-btn-mock" style="flex:1;font-size:0.75rem;background:var(--surface3);">✏ Edit</div>
          </div>
        </div>`,
        title: 'Manage Club Members',
        desc:  'The Members page shows every registered player with their club rating. You can add new members, edit nicknames and gender, adjust ratings, and remove players from the roster.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-label" style="margin-bottom:8px;">Court Settings</div>
          <div class="demo-scene-card" style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.85rem;">Number of Courts</span>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="demo-btn-mock" style="padding:4px 12px;font-size:1rem;">−</div>
              <span style="font-weight:700;font-size:1.1rem;">4</span>
              <div class="demo-btn-mock" style="padding:4px 12px;font-size:1rem;">＋</div>
            </div>
          </div>
          <div class="demo-scene-card" style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.85rem;">Session Password</span>
            <div class="demo-input-mock" style="width:80px;">••••</div>
          </div>
        </div>`,
        title: 'Configure Courts & Access',
        desc:  'In Settings you can change how many courts are active for a session and set or clear the session password. Only Vault managers can change these — Organisers use whatever is configured here.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div class="demo-scene-card" style="margin-bottom:8px;text-align:center;">
            <div style="font-size:1.6rem;margin-bottom:4px;">⚡</div>
            <div style="font-weight:700;font-size:0.9rem;">Pro Plan</div>
            <div style="color:var(--text-dim);font-size:0.75rem;margin-top:4px;">Unlimited sessions · All modes · Priority support</div>
          </div>
          <div class="demo-btn-mock">Manage Subscription</div>
        </div>`,
        title: 'Subscription & App Settings',
        desc:  'The Subscription page shows your current plan and lets you upgrade. From Settings you can also change the app language, theme (dark/light), tile style, and other preferences.',
      },
      {
        visual: `<div class="demo-visual-scene">
          <div style="font-size:2.8rem;margin-bottom:10px;">🔐</div>
          <div class="demo-scene-title">Vault mastered!</div>
          <div class="demo-scene-sub">You now control the full club experience</div>
        </div>`,
        title: 'Vault — All Done!',
        desc:  'You now know how to set up and administer a club from top to bottom. Vault gives you full control so your Organisers and Viewers can have a smooth, well-managed session every time.',
      },
    ],
  },
];

/* ── State ───────────────────────────────────────────────────── */

var _demoRoleIdx  = 0;
var _demoSlideIdx = 0;

/* ── Open / Close ────────────────────────────────────────────── */

function openDemo() {
  _demoRoleIdx  = 0;
  _demoSlideIdx = 0;
  var el = document.getElementById('demoOverlay');
  if (!el) return;
  el.style.display = 'flex';
  _demoRenderRolePicker();
}

function closeDemo() {
  var el = document.getElementById('demoOverlay');
  if (el) el.style.display = 'none';
}

/* ── Role picker screen ──────────────────────────────────────── */

function _demoRenderRolePicker() {
  var body = document.getElementById('demoBody');
  if (!body) return;

  var cards = DEMO_ROLES.map(function(role, i) {
    return (
      '<button class="demo-role-card" style="border-color:' + role.border + ';background:' + role.color + '" ' +
        'onclick="_demoStartRole(' + i + ')">' +
        '<span class="demo-role-icon">' + role.icon + '</span>' +
        '<span class="demo-role-label">' + role.label + '</span>' +
        '<span class="demo-role-arr">›</span>' +
      '</button>'
    );
  }).join('');

  body.innerHTML =
    '<div class="demo-picker-wrap">' +
      '<div class="demo-picker-hero">🎬</div>' +
      '<div class="demo-picker-title">Choose a Role</div>' +
      '<div class="demo-picker-sub">Pick a role to see a step-by-step walkthrough of how to use the app.</div>' +
      '<div class="demo-role-list">' + cards + '</div>' +
    '</div>';

  _demoSetHeader('App Demo', false);
  _demoHideNav();
}

/* ── Start a role slideshow ──────────────────────────────────── */

function _demoStartRole(roleIdx) {
  _demoRoleIdx  = roleIdx;
  _demoSlideIdx = 0;
  _demoRenderSlide();
}

/* ── Render current slide ────────────────────────────────────── */

function _demoRenderSlide() {
  var role  = DEMO_ROLES[_demoRoleIdx];
  var slide = role.slides[_demoSlideIdx];
  var total = role.slides.length;
  var body  = document.getElementById('demoBody');
  if (!body || !slide) return;

  body.innerHTML =
    '<div class="demo-slide">' +
      '<div class="demo-visual">' + slide.visual + '</div>' +
      '<div class="demo-slide-content">' +
        '<div class="demo-slide-step">Step ' + (_demoSlideIdx + 1) + ' of ' + total + '</div>' +
        '<div class="demo-slide-title">' + slide.title + '</div>' +
        '<div class="demo-slide-desc">' + slide.desc + '</div>' +
      '</div>' +
    '</div>';

  _demoSetHeader(role.icon + ' ' + role.label, true);
  _demoRenderNav(role, total);
}

/* ── Header ─────────────────────────────────────────────────── */

function _demoSetHeader(title, showBack) {
  var titleEl = document.getElementById('demoHeaderTitle');
  var backBtn = document.getElementById('demoBackBtn');
  if (titleEl) titleEl.textContent = title;
  if (backBtn) backBtn.style.display = showBack ? 'flex' : 'none';
}

/* ── Nav bar ─────────────────────────────────────────────────── */

function _demoRenderNav(role, total) {
  var nav = document.getElementById('demoNav');
  if (!nav) return;

  var dots = '';
  for (var i = 0; i < total; i++) {
    dots += '<span class="demo-dot' + (i === _demoSlideIdx ? ' active' : '') + '"></span>';
  }

  var isLast  = _demoSlideIdx === total - 1;
  var isFirst = _demoSlideIdx === 0;

  nav.style.display = 'flex';
  nav.innerHTML =
    '<button class="demo-nav-btn secondary" onclick="_demoPrev()" ' + (isFirst ? 'disabled' : '') + '>‹ Prev</button>' +
    '<div class="demo-dots">' + dots + '</div>' +
    (isLast
      ? '<button class="demo-nav-btn primary" onclick="_demoBackToPicker()">Done ✓</button>'
      : '<button class="demo-nav-btn primary" onclick="_demoNext()">Next ›</button>'
    );
}

function _demoHideNav() {
  var nav = document.getElementById('demoNav');
  if (nav) nav.style.display = 'none';
}

/* ── Navigation actions ──────────────────────────────────────── */

function _demoNext() {
  var role = DEMO_ROLES[_demoRoleIdx];
  if (_demoSlideIdx < role.slides.length - 1) {
    _demoSlideIdx++;
    _demoRenderSlide();
  }
}

function _demoPrev() {
  if (_demoSlideIdx > 0) {
    _demoSlideIdx--;
    _demoRenderSlide();
  }
}

function _demoBackToPicker() {
  _demoRoleIdx  = 0;
  _demoSlideIdx = 0;
  _demoRenderRolePicker();
}

function _demoBackFromSlide() {
  /* Back arrow from inside a slideshow → role picker */
  _demoRenderRolePicker();
}
