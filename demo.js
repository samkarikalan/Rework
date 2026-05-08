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

      /* ── Slide 1: Viewer home screen ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="home-grid" style="margin:0 0 10px;">
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon tile-profile"><span>👤</span></div>
                <div class="home-tile-name">My Card</div>
                <div class="home-tile-sub">Not selected</div>
              </div>
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon">📡</div>
                <div class="home-tile-name">Dashboard</div>
                <div class="home-tile-sub">Live sessions</div>
              </div>
            </div>
            <div class="vcl-tile" style="pointer-events:none;">
              <div class="vcl-header">
                <div class="vcl-header-left">
                  <div class="home-tile-icon vcl-icon">🏢</div>
                  <div>
                    <div class="home-tile-name">My Clubs</div>
                    <div class="home-tile-sub">Find &amp; request</div>
                  </div>
                </div>
                <span class="vcl-arr">›</span>
              </div>
            </div>
          </div>`,
        title: 'Viewer Home Screen',
        desc:  'After logging in as Viewer you see two tiles — "My Card" for your player profile and rating, and "Dashboard" to find live sessions. Below is "My Clubs" to connect to your club.',
      },

      /* ── Slide 2: My Clubs — connected state ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="vcl-tile" style="pointer-events:none;">
              <div class="vcl-header">
                <div class="vcl-header-left">
                  <div class="home-tile-icon vcl-icon">🏢</div>
                  <div>
                    <div class="home-tile-name">My Clubs</div>
                    <div class="home-tile-sub">Find &amp; request</div>
                  </div>
                </div>
                <span class="vcl-arr">›</span>
              </div>
              <div class="vcl-list">
                <div class="vcl-row vcl-row-active">
                  <span class="vcl-dot">🏸</span>
                  <div class="vcl-row-info">
                    <div class="vcl-row-name">Tokyo Badminton Club</div>
                    <div class="vcl-row-nick">member · tap to manage</div>
                  </div>
                  <span class="vcl-badge vcl-badge-active">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>`,
        title: 'Connect to Your Club',
        desc:  'Tap "My Clubs" to open the club list. Find your club and request to join — your organiser or vault manager approves the request. Once active, the club shows with an ACTIVE badge.',
      },

      /* ── Slide 3: Dashboard — live session card ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="dash-section-title">
              <span class="dash-live-dot"></span> Live Now
            </div>
            <div class="dash-session-card live" style="pointer-events:none;">
              <div class="dash-card-top">
                <div class="dash-card-club">Tokyo Badminton Club</div>
                <div class="dash-live-badge">
                  <div class="dash-live-dot-sm"></div>LIVE
                </div>
              </div>
              <div class="dash-card-meta">
                <span>👥 8 players</span>
                <span>🔄 3 rounds</span>
                <span>▶ Kari</span>
              </div>
              <div class="dash-card-chips">
                <div class="dash-chip">Ali</div>
                <div class="dash-chip">Sam</div>
                <div class="dash-chip me">Kari ★</div>
                <div class="dash-chip">Jay</div>
                <div class="dash-chip">+4</div>
              </div>
            </div>
          </div>`,
        title: 'Find a Live Session on Dashboard',
        desc:  'Tap "Dashboard" to see all sessions for your club. Live sessions show a pulsing LIVE badge with the organiser name, player count, and round count. Player chips show everyone in the session — your name is highlighted. Tap the card to watch.',
      },

      /* ── Slide 4: Viewer page — Live tab ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="viewer-subtabs">
              <button class="viewer-subtab-btn active" style="pointer-events:none;">🏸 Live</button>
              <button class="viewer-subtab-btn" style="pointer-events:none;">📊 Summary</button>
            </div>
            <div style="margin:8px 6px 0;">
              <div class="viewer-info-bar">
                <span class="viewer-info-dot"></span>
                <span class="viewer-info-text"><strong>Tokyo Badminton Club</strong> · Kari · 32m</span>
              </div>
              <div class="round-wrapper viewer-rounds" style="pointer-events:none;">
                <div class="round-header">Round 3</div>
                <div class="courtcard court-1">
                  <div class="courtname">Court 1</div>
                  <div class="teams">
                    <div class="team" data-team-side="L"><button class="Lplayer-btn" style="pointer-events:none;">Ali</button><button class="Lplayer-btn" style="pointer-events:none;">Sam</button></div>
                    <div class="vs-divider"><div class="vs-line"></div><span>VS</span><div class="vs-line"></div></div>
                    <div class="team" data-team-side="R"><button class="Rplayer-btn" style="pointer-events:none;">Jay</button><button class="Rplayer-btn" style="pointer-events:none;">Kim</button></div>
                  </div>
                </div>
                <div class="round-header" style="padding-left:12px;">Sitting out</div>
                <div class="rest-box" style="pointer-events:none;display:flex;">
                  <span class="rest-btn" style="pointer-events:none;cursor:default;">Kari</span>
                  <span class="rest-btn" style="pointer-events:none;cursor:default;">Max</span>
                </div>
              </div>
            </div>
          </div>`,
        title: 'Live Tab — Current Round',
        desc:  'The Live tab shows the current round with all courts and their matchups. The info bar shows the club name, who started the session, and elapsed time. Sitting-out players appear below the courts. The view auto-refreshes every 5 seconds.',
      },

      /* ── Slide 5: Viewer page — Summary tab ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="viewer-subtabs">
              <button class="viewer-subtab-btn" style="pointer-events:none;">🏸 Live</button>
              <button class="viewer-subtab-btn active" style="pointer-events:none;">📊 Summary</button>
            </div>
            <div style="margin:8px 6px 0;">
              <div class="report-header">
                <div class="header-strip"></div>
                <div class="header-rank">Rank</div>
                <div class="header-name">Name</div>
                <div class="header-wins">W</div>
                <div class="header-played">P</div>
                <div class="header-rested">R</div>
              </div>
              <div class="player-card top-1" style="--strip-color:#f5a623;pointer-events:none;">
                <div class="rating-strip"></div>
                <div class="rank">#1</div>
                <div class="name">Ali</div>
                <div class="stat wins">5</div>
                <div class="stat played">6</div>
                <div class="stat rest">1</div>
                <span class="rating-badge"></span>
                <div class="stat-label lbl-wins">W</div>
                <div class="stat-label lbl-played">P</div>
                <div class="stat-label lbl-rest">R</div>
              </div>
              <div class="player-card top-2" style="--strip-color:#9b9b9b;pointer-events:none;">
                <div class="rating-strip"></div>
                <div class="rank">#2</div>
                <div class="name">Sam</div>
                <div class="stat wins">4</div>
                <div class="stat played">6</div>
                <div class="stat rest">0</div>
                <span class="rating-badge"></span>
                <div class="stat-label lbl-wins">W</div>
                <div class="stat-label lbl-played">P</div>
                <div class="stat-label lbl-rest">R</div>
              </div>
            </div>
          </div>`,
        title: 'Summary Tab — Leaderboard',
        desc:  'Switch to the Summary tab to see the session leaderboard ranked by Wins (W), with Games Played (P) and Resting (R) shown per player. The colour strip on the left marks the top 3. All previous rounds are listed below the leaderboard.',
      },

      /* ── Slide 6: Done ── */
      {
        visual: `
          <div class="demo-visual-scene">
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

      /* ── Slide 1: Organiser home screen ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="home-grid" style="margin:0;">
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon tile-pairs" id="orgTileIcon">🏢</div>
                <div class="home-tile-name">Club</div>
                <div class="home-tile-sub">Tap to connect</div>
              </div>
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon tile-players">👥</div>
                <div class="home-tile-name">Players</div>
                <div class="home-tile-sub">Add · Remove</div>
              </div>
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon tile-pairs">🤝</div>
                <div class="home-tile-name">Fixed Pairs</div>
                <div class="home-tile-sub">Always together</div>
              </div>
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon">📡</div>
                <div class="home-tile-name">Dashboard</div>
                <div class="home-tile-sub">Live sessions</div>
              </div>
              <div class="home-tile" style="pointer-events:none;">
                <div class="home-tile-icon" style="position:relative;">⚡</div>
                <div class="home-tile-name">Playing</div>
                <div class="home-tile-sub">—</div>
              </div>
            </div>
          </div>`,
        title: 'Organiser Home Screen',
        desc:  'The Organiser home shows five tiles: Club (connect to your club), Players (manage who is playing), Fixed Pairs (lock two players together), Dashboard (live sessions), and Playing (the active round). Start by connecting to your club.',
      },

      /* ── Slide 2: Players page ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="sheet-header" style="position:relative;top:0;">
              <div class="sheet-header-spacer"></div>
              <span class="sheet-title">👥 Players</span>
              <div class="sheet-header-spacer"></div>
            </div>
            <div class="card browse-card" style="pointer-events:none;margin:8px 0 4px;">
              <div class="browse-left">
                <span class="browse-title">➕ Add Players</span>
                <span class="browse-sub">Select from saved players</span>
              </div>
              <div class="browse-arrow">›</div>
            </div>
            <div class="card" style="padding:0 4px;">
              <div class="player-list" style="pointer-events:none;">
                <div class="player-edit-card male">
                  <span class="pec-active">✔</span>
                  <span class="pec-sl">1</span>
                  <span class="pec-gender"></span>
                  <span class="pec-name">Ali</span>
                  <span class="pec-rating" style="font-size:0.75rem;color:var(--muted);">1450</span>
                </div>
                <div class="player-edit-card female">
                  <span class="pec-active">✔</span>
                  <span class="pec-sl">2</span>
                  <span class="pec-gender"></span>
                  <span class="pec-name">Sam</span>
                  <span class="pec-rating" style="font-size:0.75rem;color:var(--muted);">1380</span>
                </div>
                <div class="player-edit-card male inactive">
                  <span class="pec-active"></span>
                  <span class="pec-sl">3</span>
                  <span class="pec-gender"></span>
                  <span class="pec-name">Jay</span>
                  <span class="pec-rating" style="font-size:0.75rem;color:var(--muted);">1310</span>
                </div>
              </div>
            </div>
          </div>`,
        title: 'Players Page — Who Is Playing',
        desc:  'On the Players page, tap "Add Players" to bring in club members for this session. Each player row shows their sequence number and rating. The checkbox on the left marks them as active (playing) — greyed-out rows are inactive (sitting out).',
      },

      /* ── Slide 3: Rounds page — before start ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="rounds-top-bar" style="position:relative;">
              <button class="rtb-back" style="pointer-events:none;">‹ Home</button>
              <button class="rtb-settings" style="pointer-events:none;">⚙️</button>
              <button class="rtb-settings" style="pointer-events:none;">🕓</button>
              <div class="rtb-spacer"></div>
              <div class="rtb-live">
                <div class="rtb-dot"></div>
                <span class="rtb-live-txt">LIVE</span>
                <button class="rtb-end" style="pointer-events:none;">End</button>
              </div>
            </div>
            <div class="title-card" style="pointer-events:none;">
              <div id="roundTitle" style="font-size:1rem;font-weight:700;">Round 3</div>
              <span class="mode-banner-badge ready-mode">READY</span>
            </div>
            <div class="action-card" style="pointer-events:none;margin:8px 0 0;">
              <button class="action mid small disabled-btn">🎲</button>
              <button class="action right primary next-round-state">
                <span>Next Round</span>
                <span class="icon"> ▶</span>
              </button>
            </div>
          </div>`,
        title: 'Rounds Page — Generate & Start',
        desc:  'The Rounds page is the session hub. The top bar shows Home, Settings (⚙️), and History (🕓) buttons, and a pulsing LIVE badge once a session is active. Tap "Next Round" to generate and start the next round. Tap 🎲 to reshuffle pairings.',
      },

      /* ── Slide 4: Round settings sheet ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="rounds-nav-tiles" style="pointer-events:none;margin:0 0 10px;">
              <div class="rounds-nav-tile" data-tile-color="1">
                <div class="rounds-nav-icon tile-players">👥</div>
                <div class="rounds-nav-name">Players</div>
                <div class="rounds-nav-sub">Add · Remove</div>
              </div>
              <div class="rounds-nav-tile" data-tile-color="2">
                <div class="rounds-nav-icon tile-pairs">🤝</div>
                <div class="rounds-nav-name">Fixed Pairs</div>
                <div class="rounds-nav-sub">Optional</div>
              </div>
            </div>
            <div class="setting-row" style="pointer-events:none;">
              <label class="setting-label">Courts</label>
              <div class="counter">
                <button class="circle-btn">−</button>
                <span style="font-weight:700;padding:0 8px;">3</span>
                <button class="circle-btn">+</button>
              </div>
            </div>
            <div class="setting-divider"></div>
            <div class="setting-row" style="pointer-events:none;">
              <label class="setting-label"><span>⚡</span> Competitive</label>
              <label class="switch">
                <input type="checkbox">
                <span class="slider"></span>
              </label>
            </div>
          </div>`,
        title: 'Round Settings — Courts & Mode',
        desc:  'Tap ⚙️ to open Round Settings. Use the + / − counter to set the number of active courts. Toggle Competitive mode on for rating-based pairing, or leave it off for casual random pairing. Quick-nav tiles let you jump to Players or Fixed Pairs without leaving the round.',
      },

      /* ── Slide 5: Active round — courts ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="round-wrapper" style="pointer-events:none;">
              <div class="round-header">Round 3</div>
              <div class="courtcard court-1">
                <div class="courtname">Court 1</div>
                <div class="teams">
                  <div class="team" data-team-side="L">
                    <button class="Lplayer-btn" style="pointer-events:none;">Ali</button>
                    <button class="Lplayer-btn" style="pointer-events:none;">Sam</button>
                  </div>
                  <div class="vs-divider"><div class="vs-line"></div><span>VS</span><div class="vs-line"></div></div>
                  <div class="team" data-team-side="R">
                    <button class="Rplayer-btn" style="pointer-events:none;">Jay</button>
                    <button class="Rplayer-btn" style="pointer-events:none;">Kim</button>
                  </div>
                </div>
              </div>
              <div class="courtcard court-2">
                <div class="courtname">Court 2</div>
                <div class="teams">
                  <div class="team" data-team-side="L">
                    <button class="Lplayer-btn" style="pointer-events:none;">Mia</button>
                    <button class="Lplayer-btn" style="pointer-events:none;">Leo</button>
                  </div>
                  <div class="vs-divider"><div class="vs-line"></div><span>VS</span><div class="vs-line"></div></div>
                  <div class="team" data-team-side="R">
                    <button class="Rplayer-btn" style="pointer-events:none;">Zoe</button>
                    <button class="Rplayer-btn" style="pointer-events:none;">Max</button>
                  </div>
                </div>
              </div>
              <div class="round-header" style="padding-left:12px;">Sitting out</div>
              <div class="rest-box" style="pointer-events:none;display:flex;">
                <span class="rest-btn" style="cursor:default;">Kari</span>
              </div>
            </div>
          </div>`,
        title: 'Active Round — Courts & Scores',
        desc:  'Once started, each court card shows the two teams. Tap any player name to record the score for that court — a score entry dialog opens. Sitting-out players appear below the courts. The lock icon on the round title pins the pairings so no accidental reshuffling occurs.',
      },

      /* ── Slide 6: Summary page ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="sheet-header" style="position:relative;top:0;">
              <div class="sheet-header-spacer"></div>
              <span class="sheet-title">📊 Summary</span>
              <div class="sheet-header-spacer"></div>
            </div>
            <div id="reportContainer" style="pointer-events:none;padding:0 4px;">
              <div class="report-header">
                <div class="header-strip"></div>
                <div class="header-rank">Rank</div>
                <div class="header-name">Name</div>
                <div class="header-wins">W</div>
                <div class="header-played">P</div>
                <div class="header-rested">R</div>
              </div>
              <div class="player-card top-1" style="--strip-color:#f5a623;pointer-events:none;">
                <div class="rating-strip"></div>
                <div class="rank">#1</div>
                <div class="name">Ali</div>
                <div class="stat wins">5</div>
                <div class="stat played">6</div>
                <div class="stat rest">1</div>
                <span class="rating-badge"></span>
                <div class="stat-label lbl-wins">W</div>
                <div class="stat-label lbl-played">P</div>
                <div class="stat-label lbl-rest">R</div>
              </div>
              <div class="player-card top-2" style="--strip-color:#9b9b9b;pointer-events:none;">
                <div class="rating-strip"></div>
                <div class="rank">#2</div>
                <div class="name">Sam</div>
                <div class="stat wins">4</div>
                <div class="stat played">6</div>
                <div class="stat rest">0</div>
                <span class="rating-badge"></span>
                <div class="stat-label lbl-wins">W</div>
                <div class="stat-label lbl-played">P</div>
                <div class="stat-label lbl-rest">R</div>
              </div>
            </div>
          </div>`,
        title: 'Summary — End of Session',
        desc:  'After all rounds are done, go to the Summary page to review the full leaderboard and every round\'s matchups. Tap the 📄 export button to download an HTML report. When ready, tap "End" in the top bar to close the session and update player ratings.',
      },

      /* ── Slide 7: Done ── */
      {
        visual: `
          <div class="demo-visual-scene">
            <div style="font-size:2.8rem;margin-bottom:10px;">🏅</div>
            <div class="demo-scene-title">Session complete!</div>
            <div class="demo-scene-sub" style="max-width:280px;">Club → Players → Rounds → Score → Summary → End</div>
          </div>`,
        title: 'Organiser — All Done!',
        desc:  'That covers the full Organiser workflow: connect your club, mark players active, generate rounds, record scores, review the summary, and end the session. Ratings update automatically. Try another role or close to return to Help.',
      },
    ],
  },

  {
    key:   'vault',
    label: 'Vault',
    icon:  '🔑',
    color: 'rgba(245,166,35,0.15)',
    border:'rgba(245,166,35,0.4)',
    slides: [

      /* ── Slide 1: Mode select overlay ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="ml-inner" style="padding:16px 0 8px;align-items:center;display:flex;flex-direction:column;gap:6px;">
              <div class="ml-logo" style="font-size:2rem;margin-bottom:4px;">🏸</div>
              <div class="ml-title" style="font-size:1rem;margin-bottom:2px;">Choose Mode</div>
              <div class="ml-modes" style="gap:8px;margin-bottom:0;width:100%;">
                <button class="ml-mode viewer" style="pointer-events:none;padding:10px 14px;">
                  <div class="ml-mode-icon" style="font-size:1.2rem;background:rgba(108,140,255,0.12);width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;">👁</div>
                  <div class="ml-mode-info">
                    <div class="ml-mode-name" style="color:#6c8cff;">Viewer</div>
                    <div class="ml-mode-desc">Watch live rounds &amp; scores</div>
                  </div>
                  <span class="ml-arr">›</span>
                </button>
                <button class="ml-mode organiser" style="pointer-events:none;padding:10px 14px;">
                  <div class="ml-mode-icon" style="font-size:1.2rem;background:rgba(45,206,137,0.12);width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;">🏆</div>
                  <div class="ml-mode-info">
                    <div class="ml-mode-name" style="color:#2dce89;">Round Organiser</div>
                    <div class="ml-mode-desc">Run session, score games</div>
                  </div>
                  <span class="ml-arr">›</span>
                </button>
                <button class="ml-mode vault" style="pointer-events:none;padding:10px 14px;">
                  <div class="ml-mode-icon" style="font-size:1.2rem;background:rgba(245,166,35,0.12);width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;">🔑</div>
                  <div class="ml-mode-info">
                    <div class="ml-mode-name" style="color:#f5a623;">Vault Manager</div>
                    <div class="ml-mode-desc">Club admin — players, requests</div>
                  </div>
                  <span class="ml-arr">›</span>
                </button>
              </div>
            </div>
          </div>`,
        title: 'What is Vault Manager Mode?',
        desc:  'Vault Manager is the admin layer of the app. On the mode selection screen, tap "Vault Manager" to enter. You will need your admin password. From Vault you create clubs, manage all members, approve join requests, and control club-level settings.',
      },

      /* ── Slide 2: Vault home grid ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="vault-club-tile" style="margin:0 0 10px;cursor:default;">
              <div class="vct-dot"></div>
              <div class="vct-info">
                <div class="vct-name">Tokyo Badminton Club</div>
                <span class="vct-badge">ADMIN</span>
              </div>
              <button style="background:none;border:1px solid var(--red,#e63757);color:var(--red,#e63757);border-radius:8px;padding:5px 10px;font-size:0.7rem;font-weight:700;cursor:default;">Leave</button>
              <span style="color:var(--muted,#aaa);font-size:1rem;margin-left:6px;">›</span>
            </div>
            <div class="vault-tile-grid" style="pointer-events:none;">
              <div class="vault-tile vt-register" data-tile-color="1">
                <div class="vt-icon">📋</div>
                <div class="vt-stat">12</div>
                <div class="vt-name">Register</div>
                <div class="vt-sub">players in club</div>
              </div>
              <div class="vault-tile vt-modify" data-tile-color="2">
                <div class="vt-icon">✏️</div>
                <div class="vt-stat">12</div>
                <div class="vt-name">Modify</div>
                <div class="vt-sub">tap to edit</div>
              </div>
              <div class="vault-tile vt-requests" data-tile-color="3">
                <div class="vt-badge" style="display:block;">NEW</div>
                <div class="vt-icon">🔔</div>
                <div class="vt-stat">2</div>
                <div class="vt-name">Requests</div>
                <div class="vt-sub">pending approval</div>
              </div>
              <div class="vault-tile vt-requests" data-tile-color="4">
                <div class="vt-icon">🗑️</div>
                <div class="vt-name">Delete</div>
                <div class="vt-sub">remove club</div>
              </div>
            </div>
          </div>`,
        title: 'Vault Home — Four Admin Tiles',
        desc:  'The Vault home shows your connected club at the top with an ADMIN badge. Below are four tiles: Register (add new members), Modify (edit existing members), Requests (approve join requests — NEW badge appears when pending), and Delete (remove the club).',
      },

      /* ── Slide 3: Register page ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="sheet-header" style="position:relative;top:0;">
              <div class="sheet-header-spacer"></div>
              <span class="sheet-title">📋 Register Players</span>
              <div class="sheet-header-spacer"></div>
            </div>
            <div class="vault-wrap" style="padding:10px 4px 0;">
              <div class="vm-search-wrap" style="margin-bottom:8px;">
                <span class="vm-search-icon">🔍</span>
                <input class="vm-search-input" placeholder="Search or add new player…" style="pointer-events:none;">
              </div>
              <div class="vm-player-list" style="pointer-events:none;">
                <div class="vm-player-row male">
                  <div class="vm-avatar male">A</div>
                  <div class="vm-player-info">
                    <div class="vm-player-name-row">
                      <span class="vm-player-name">Ali</span>
                      <span class="vm-userid-chip">@ali_kbrr</span>
                    </div>
                    <div class="vm-player-meta">Male · Rating 1450</div>
                  </div>
                  <div class="vm-row-actions">
                    <button class="vm-edit-btn">✏️</button>
                  </div>
                </div>
                <div class="vm-player-row female">
                  <div class="vm-avatar female">S</div>
                  <div class="vm-player-info">
                    <div class="vm-player-name-row">
                      <span class="vm-player-name">Sam</span>
                      <span class="vm-userid-chip vm-unlinked">unlinked</span>
                    </div>
                    <div class="vm-player-meta">Female · Rating 1380</div>
                  </div>
                  <div class="vm-row-actions">
                    <button class="vm-edit-btn">✏️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        title: 'Register — Add New Members',
        desc:  'The Register page shows all club members. Each row displays an avatar initial, player name, linked user account chip (@userId), gender, and rating. Tap ✏️ to edit a player. An "unlinked" chip means the player has no app account linked yet — they can still be added to sessions.',
      },

      /* ── Slide 4: Requests page ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="sheet-header" style="position:relative;top:0;">
              <div class="sheet-header-spacer"></div>
              <span class="sheet-title">🔔 Join Requests</span>
              <div class="sheet-header-spacer"></div>
            </div>
            <div class="vault-requests-list" style="pointer-events:none;">
              <div class="vault-request-card">
                <div class="vault-request-info">
                  <div class="vault-request-name">Leo Tanaka</div>
                  <div class="vault-request-id">@leo_t · Requested 2h ago</div>
                </div>
                <div class="vault-request-actions">
                  <button class="vault-request-accept">✓ Accept</button>
                  <button class="vault-request-reject">✕</button>
                </div>
              </div>
              <div class="vault-request-card">
                <div class="vault-request-info">
                  <div class="vault-request-name">Zoe Kim</div>
                  <div class="vault-request-id">@zoe_k · Requested 5h ago</div>
                </div>
                <div class="vault-request-actions">
                  <button class="vault-request-accept">✓ Accept</button>
                  <button class="vault-request-reject">✕</button>
                </div>
              </div>
            </div>
          </div>`,
        title: 'Requests — Approve New Members',
        desc:  'When players request to join your club, they appear on the Requests page. Each card shows the player name, their @userId, and when they requested. Tap "Accept" to approve and add them to the club roster, or ✕ to reject. The NEW badge on the home tile clears once all requests are handled.',
      },

      /* ── Slide 5: Create club panel ── */
      {
        visual: `
          <div style="width:100%;padding:0 2px;">
            <div class="sheet-header" style="position:relative;top:0;">
              <div class="sheet-header-spacer"></div>
              <span class="sheet-title">🗑️ Delete Club</span>
              <div class="sheet-header-spacer"></div>
            </div>
            <div style="padding:8px 4px 0;">
              <div class="vault-tile-grid" style="pointer-events:none;margin:0 0 10px;">
                <div class="vault-tile vt-register" data-tile-color="1" style="min-height:80px;">
                  <div class="vt-icon">🔗</div>
                  <div class="vt-name">Connect</div>
                  <div class="vt-sub">join a club</div>
                </div>
                <div class="vault-tile vt-modify" data-tile-color="2" style="min-height:80px;">
                  <div class="vt-icon">➕</div>
                  <div class="vt-name">Create</div>
                  <div class="vt-sub">new club</div>
                </div>
              </div>
              <div class="settings-card" style="padding:14px;pointer-events:none;">
                <div class="manage-section-title">Create New Club</div>
                <input class="club-input" style="width:100%;margin-bottom:6px;" placeholder="Club name" readonly>
                <input class="club-input" style="width:100%;margin-bottom:6px;" placeholder="Member password" readonly>
                <input class="club-input" style="width:100%;margin-bottom:8px;" placeholder="Admin password" readonly>
                <button class="btn-save" style="width:100%;pointer-events:none;">Create Club</button>
              </div>
            </div>
          </div>`,
        title: 'Club Management — Create or Connect',
        desc:  'In the Club Management page, tap "Create" to set up a brand-new club — enter a club name, a member password (share this with players to let them join), and an admin password (keep this private). Tap "Connect" to link to an existing club using its admin password.',
      },

      /* ── Slide 6: Done ── */
      {
        visual: `
          <div class="demo-visual-scene">
            <div style="font-size:2.8rem;margin-bottom:10px;">🔐</div>
            <div class="demo-scene-title">Vault mastered!</div>
            <div class="demo-scene-sub" style="max-width:280px;">Mode Select → Vault Home → Register · Modify · Requests → Club Mgmt</div>
          </div>`,
        title: 'Vault — All Done!',
        desc:  'You now know how to administer a club from top to bottom — create and connect clubs, register and modify members, approve join requests, and manage club settings. Vault keeps everything organised so Organisers and Viewers have a smooth experience every session.',
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
