/* ============================================================
   SUPABASE SERVICE LAYER — v2
   New schema: players, clubs, memberships, sessions, matches, join_requests
   ============================================================ */

const SUPABASE_URL = "https://hplkoxdorbfjhwbvqatn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwbGtveGRvcmJmamh3YnZxYXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTcyOTgsImV4cCI6MjA5MDE5MzI5OH0.G-04VeYkUGMF93qw61ryTaQ0Q7xK3dOAHLDvG6l31vc";

const SB_HEADERS = {
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "return=representation"
};

const CACHE_PLAYERS        = "kbrr_cache_players";
const CACHE_TIMESTAMP      = "kbrr_cache_ts";
const CACHE_TTL_MS         = 5 * 60 * 1000;
const CACHE_GLOBAL_PLAYERS = "kbrr_cache_global_players";
const SYNC_QUEUE_KEY       = "kbrr_sync_queue";
const SESSION_TIMEOUT_MS   = 8 * 60 * 60 * 1000;

/* ============================================================
   CORE HTTP HELPERS
============================================================ */

function sbUrl(table, query = "") {
  return `${SUPABASE_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
}

async function sbGet(table, query = "") {
  const res = await fetch(sbUrl(table, query), { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(sbUrl(table), {
    method:  "POST",
    headers: SB_HEADERS,
    body:    JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${table} failed`);
  }
  return res.json();
}

async function sbPatch(table, query, body) {
  const res = await fetch(sbUrl(table, query), {
    method:  "PATCH",
    headers: SB_HEADERS,
    body:    JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PATCH ${table} failed`);
  }
  return res.json();
}

async function sbDelete(table, query) {
  const res = await fetch(sbUrl(table, query), {
    method:  "DELETE",
    headers: SB_HEADERS
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
}

async function sbUpsert(table, body, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { ...SB_HEADERS, "Prefer": "resolution=merge-duplicates,return=representation" },
    body:    JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `UPSERT ${table} failed: ${res.status}`);
  }
  return res.json();
}

/* ============================================================
   ACTIVE CLUB — stored in localStorage
============================================================ */

function getMyClub() {
  return {
    id:   localStorage.getItem("kbrr_my_club_id")   || null,
    name: localStorage.getItem("kbrr_my_club_name") || null
  };
}
function setMyClub(id, name) {
  localStorage.setItem("kbrr_my_club_id",   id);
  localStorage.setItem("kbrr_my_club_name", name);
}
function clearMyClub() {
  localStorage.removeItem("kbrr_my_club_id");
  localStorage.removeItem("kbrr_my_club_name");
}

/* ============================================================
   CURRENT PLAYER — stored in localStorage
============================================================ */

function getMyPlayer() {
  try {
    const raw = localStorage.getItem("kbrr_my_player");
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}
function setMyPlayer(player) {
  localStorage.setItem("kbrr_my_player", JSON.stringify(player));
}
function clearMyPlayer() {
  localStorage.removeItem("kbrr_my_player");
}

/* ============================================================
   AUTH — OTP via Supabase Auth + players table
============================================================ */

async function dbSendOtp(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
    body: JSON.stringify({
      email:       email.trim().toLowerCase(),
      create_user: true,
      options: {
        shouldCreateUser: true,
        emailRedirectTo:  null  // disable magic link redirect — send OTP only
      }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || err.message || "Failed to send OTP");
  }
  return true;
}

async function dbVerifyOtp(email, token) {
  // Try both types — 'magiclink' for /auth/v1/otp flow, 'email' for signup confirmation
  const types = ["magiclink", "email"];
  let lastErr = "Invalid or expired OTP";
  for (const type of types) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type
      })
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    lastErr = err.msg || err.message || lastErr;
  }
  throw new Error(lastErr);
}

async function dbGetOrCreatePlayer(email, displayName, gender) {
  email = email.trim().toLowerCase();
  const rows = await sbGet("players",
    `email=eq.${encodeURIComponent(email)}&select=id,email,display_name,gender,global_rating,global_points`
  );
  if (rows && rows.length) return rows[0];
  const created = await sbPost("players", {
    email,
    display_name:  displayName || email.split("@")[0],
    gender:        gender || "Male",
    global_rating: 1.0,
    global_points: 0
  });
  return created[0];
}

/* ============================================================
   PLAYERS — fetched via memberships with player join
============================================================ */

async function dbGetPlayers(forceFresh = false) {
  const now           = Date.now();
  const lastFetch     = parseInt(localStorage.getItem(CACHE_TIMESTAMP) || "0");
  const cached        = localStorage.getItem(CACHE_PLAYERS);
  const club          = getMyClub();
  const cachedClubId  = localStorage.getItem("kbrr_cache_club_id");
  const currentClubId = club.id || "none";

  if (cachedClubId !== currentClubId) {
    dbInvalidateCache();
    localStorage.setItem("kbrr_cache_club_id", currentClubId);
  }

  if (!forceFresh && cached && cachedClubId === currentClubId && (now - lastFetch) < CACHE_TTL_MS) {
    return JSON.parse(cached);
  }

  try {
    if (!club.id) return [];

    const memberships = await sbGet("memberships",
      `club_id=eq.${club.id}&select=id,nickname,club_rating,club_points,is_playing,player_id,players(id,email,display_name,gender,global_rating,global_points)&order=nickname.asc`
    );

    const normalized = memberships.map(m => ({
      id:           m.player_id,
      membershipId: m.id,
      name:         m.nickname,
      displayName:  m.nickname,
      gender:       m.players?.gender     || "Male",
      rating:       parseFloat(m.club_rating)            || 1.0,
      activeRating: parseFloat(m.club_rating)            || 1.0,
      clubRating:   parseFloat(m.club_rating)            || 1.0,
      clubPoints:   parseFloat(m.club_points)            || 0,
      globalRating: parseFloat(m.players?.global_rating) || 1.0,
      globalPoints: parseFloat(m.players?.global_points) || 0,
      email:        m.players?.email  || "",
      isPlaying:    m.is_playing      || false
    }));

    localStorage.setItem(CACHE_PLAYERS,   JSON.stringify(normalized));
    localStorage.setItem(CACHE_TIMESTAMP, String(Date.now()));
    return normalized;

  } catch(e) {
    console.warn("dbGetPlayers failed — using cache:", e.message);
    return cached ? JSON.parse(cached) : [];
  }
}

async function dbAddPlayer(nickname, gender) {
  const club = getMyClub();
  if (!club.id) throw new Error("No club selected.");

  const conflict = await sbGet("memberships",
    `club_id=eq.${club.id}&nickname=ilike.${encodeURIComponent(nickname.trim())}&select=id`
  );
  if (conflict.length) throw new Error("Nickname already exists in this club.");

  const placeholderEmail = `${nickname.trim().toLowerCase().replace(/\s+/g,"_")}.${club.id.slice(0,8)}@club.local`;
  let playerRows = await sbGet("players", `email=eq.${encodeURIComponent(placeholderEmail)}&select=id`);
  let playerId;

  if (playerRows.length) {
    playerId = playerRows[0].id;
  } else {
    const created = await sbPost("players", {
      email:         placeholderEmail,
      display_name:  nickname.trim(),
      gender:        gender || "Male",
      global_rating: 1.0,
      global_points: 0
    });
    playerId = created[0].id;
  }

  const existing = await sbGet("memberships", `player_id=eq.${playerId}&club_id=eq.${club.id}&select=id`);
  if (existing.length) throw new Error("Player already in this club.");

  await sbPost("memberships", {
    player_id:   playerId,
    club_id:     club.id,
    nickname:    nickname.trim(),
    club_rating: 1.0,
    club_points: 0
  });

  dbInvalidateCache();
  if (typeof syncToLocal === "function") await syncToLocal();
}

async function dbEditPlayer(membershipId, updates, clubAdminPassword) {
  const club = getMyClub();
  if (!club.id) throw new Error("No club selected.");
  await _verifyAdminPassword(club.id, clubAdminPassword);
  await sbPatch("memberships", `id=eq.${membershipId}`, updates);
  dbInvalidateCache();
}

async function dbDeletePlayer(membershipId, clubAdminPassword) {
  const club = getMyClub();
  if (!club.id) throw new Error("No club selected.");
  await _verifyAdminPassword(club.id, clubAdminPassword);
  await sbDelete("memberships", `id=eq.${membershipId}&club_id=eq.${club.id}`);
  dbInvalidateCache();
  if (typeof syncToLocal === "function") await syncToLocal();
}

async function dbOverrideRating(membershipId, newRating) {
  const rounded = Math.min(5.0, Math.max(1.0, Math.round(newRating * 10) / 10));
  await sbPatch("memberships", `id=eq.${membershipId}`, { club_rating: rounded });
  dbInvalidateCache();
  if (typeof syncToLocal === "function") await syncToLocal();
}

/* ============================================================
   RATING & POINTS
============================================================ */

function calcRatingDelta(currentRating, wins, losses) {
  const K = 0.3;
  return Math.round((K * wins - K * losses) * 10) / 10;
}

async function dbSyncRatings(updatedRatings) {
  const club = getMyClub();
  if (!club.id) return;
  const failed = [];

  for (const update of updatedRatings) {
    try {
      const rows = await sbGet("memberships",
        `club_id=eq.${club.id}&nickname=ilike.${encodeURIComponent(update.name)}&select=id,club_rating,club_points,player_id`
      );
      if (!rows || !rows.length) continue;
      const m = rows[0];

      const rDelta = update.ratingDelta !== undefined ? update.ratingDelta : calcRatingDelta(m.club_rating, update.wins || 0, update.losses || 0);
      const pDelta = update.pointsDelta !== undefined ? update.pointsDelta : rDelta;

      const newRating  = Math.min(5.0, Math.max(1.0, Math.round((parseFloat(m.club_rating) + rDelta) * 10) / 10));
      const newPoints  = Math.round(((parseFloat(m.club_points) || 0) + pDelta) * 10) / 10;

      await sbPatch("memberships", `id=eq.${m.id}`, { club_rating: newRating, club_points: newPoints });

      // Update global
      const pRows = await sbGet("players", `id=eq.${m.player_id}&select=id,global_rating,global_points`);
      if (pRows && pRows.length) {
        const p = pRows[0];
        await sbPatch("players", `id=eq.${m.player_id}`, {
          global_rating: Math.min(5.0, Math.max(1.0, Math.round((parseFloat(p.global_rating) + rDelta) * 10) / 10)),
          global_points: Math.round(((parseFloat(p.global_points) || 0) + pDelta) * 10) / 10
        });
      }
    } catch(e) {
      console.warn("dbSyncRatings failed for", update.name, e.message);
      failed.push(update);
    }
  }

  if (failed.length) queuePush(failed);
  dbInvalidateCache();
}

async function syncAfterRound(roundWins, roundLosses) {
  try {
    const playedNames = new Set([...roundWins.keys(), ...roundLosses.keys()]);
    const updatedRatings = (schedulerState.allPlayers || [])
      .filter(p => playedNames.has(p.name))
      .map(p => ({
        name:   p.name,
        wins:   roundWins.get(p.name)   || 0,
        losses: roundLosses.get(p.name) || 0
      }));

    await dbSyncRatings(updatedRatings);
    await dbSyncRoundsData();
    await syncToLocal();
  } catch(e) {
    console.error("syncAfterRound error:", e.message);
  }
}

/* ============================================================
   MATCHES
============================================================ */

async function dbSaveMatch(sessionId, roundNumber, pair1, pair2, winnerPair, ratingDelta, pointsDelta) {
  const club = getMyClub();
  if (!sessionId || !club.id) return;

  const allNames = [...pair1, ...pair2];
  const memberRows = await sbGet("memberships",
    `club_id=eq.${club.id}&nickname=in.(${allNames.join(",")})&select=player_id,nickname`
  ).catch(() => []);

  const nickToId = {};
  memberRows.forEach(m => { nickToId[m.nickname] = m.player_id; });

  await sbPost("matches", {
    session_id:    sessionId,
    club_id:       club.id,
    round_number:  roundNumber,
    pair1_player1: nickToId[pair1[0]] || null,
    pair1_player2: nickToId[pair1[1]] || null,
    pair2_player1: nickToId[pair2[0]] || null,
    pair2_player2: nickToId[pair2[1]] || null,
    winner_pair:   winnerPair,
    rating_delta:  ratingDelta,
    points_delta:  pointsDelta
  }).catch(e => console.warn("dbSaveMatch error:", e.message));
}

/* ============================================================
   CLUBS
============================================================ */

async function dbGetClubs() {
  try { return await sbGet("clubs", "select=id,name&order=name.asc"); }
  catch(e) { return []; }
}

async function dbAddClub(clubName, selectPassword, adminPassword) {
  if (!clubName.trim()) throw new Error("Club name required.");
  if (!selectPassword)  throw new Error("Select password required.");
  if (!adminPassword)   throw new Error("Admin password required.");
  const created = await sbPost("clubs", {
    name:            clubName.trim(),
    select_password: selectPassword,
    admin_password:  adminPassword
  });
  return created[0];
}

async function dbDeleteClub(clubId) {
  await sbDelete("clubs", `id=eq.${clubId}`);
}

async function dbVerifyClubAccess(clubId, password) {
  const pw = encodeURIComponent(password);
  const asAdmin = await sbGet("clubs", `id=eq.${clubId}&admin_password=eq.${pw}&select=id,name`);
  if (asAdmin && asAdmin.length) return { club: asAdmin[0], role: "admin" };
  const asUser  = await sbGet("clubs", `id=eq.${clubId}&select_password=eq.${pw}&select=id,name`);
  if (asUser  && asUser.length)  return { club: asUser[0],  role: "user" };
  throw new Error("Wrong password.");
}

async function _verifyAdminPassword(clubId, password) {
  const rows = await sbGet("clubs", `id=eq.${clubId}&admin_password=eq.${encodeURIComponent(password)}&select=id`);
  if (!rows || !rows.length) throw new Error("Wrong admin password.");
}

/* ============================================================
   JOIN REQUESTS
============================================================ */

async function dbSendJoinRequest(clubId, playerId, nickname) {
  const conflict = await sbGet("memberships", `club_id=eq.${clubId}&nickname=ilike.${encodeURIComponent(nickname)}&select=id`);
  if (conflict.length) throw new Error("Nickname already taken in this club.");
  const member = await sbGet("memberships", `club_id=eq.${clubId}&player_id=eq.${playerId}&select=id`);
  if (member.length) throw new Error("Already a member of this club.");
  return await sbUpsert("join_requests", { player_id: playerId, club_id: clubId, nickname, status: "pending" }, "player_id,club_id");
}

async function dbGetJoinRequests(clubId) {
  return await sbGet("join_requests",
    `club_id=eq.${clubId}&status=eq.pending&select=id,nickname,requested_at,player_id,players(email,display_name,gender)&order=requested_at.asc`
  );
}

async function dbApproveJoinRequest(requestId) {
  const rows = await sbGet("join_requests", `id=eq.${requestId}&select=player_id,club_id,nickname`);
  if (!rows || !rows.length) throw new Error("Request not found.");
  const req = rows[0];
  await sbPost("memberships", { player_id: req.player_id, club_id: req.club_id, nickname: req.nickname, club_rating: 1.0, club_points: 0 });
  await sbPatch("join_requests", `id=eq.${requestId}`, { status: "approved", reviewed_at: new Date().toISOString() });
}

async function dbRejectJoinRequest(requestId) {
  await sbPatch("join_requests", `id=eq.${requestId}`, { status: "rejected", reviewed_at: new Date().toISOString() });
}

async function dbCheckJoinRequestStatus(clubId, playerId) {
  const rows = await sbGet("join_requests", `club_id=eq.${clubId}&player_id=eq.${playerId}&select=status,nickname`).catch(() => []);
  return rows && rows.length ? rows[0] : null;
}

/* ============================================================
   SESSIONS
============================================================ */

function getMySessionId()   { return sessionStorage.getItem("kbrr_session_db_id") || null; }
function setMySessionId(id) { id ? sessionStorage.setItem("kbrr_session_db_id", id) : sessionStorage.removeItem("kbrr_session_db_id"); }

async function dbStartSession() {
  try {
    const club   = getMyClub();
    const player = getMyPlayer();
    if (!club.id) return;
    const created = await sbPost("sessions", {
      club_id:     club.id,
      started_by:  player?.id || null,
      status:      "live",
      rounds_data: []
    });
    setMySessionId(created[0]?.id || null);
  } catch(e) { console.warn("dbStartSession error:", e.message); }
}

async function dbSyncRoundsData() {
  try {
    const sessionId = getMySessionId();
    if (!sessionId) return;
    const roundsData = (allRounds || []).map(r => ({
      round:   r.round,
      resting: r.resting || [],
      games:   (r.games || []).map(g => ({ pair1: g.pair1, pair2: g.pair2, winner: g.winner || null, court: g.court || null }))
    }));
    await sbPatch("sessions", `id=eq.${sessionId}`, { rounds_data: roundsData });
  } catch(e) { console.warn("dbSyncRoundsData error:", e.message); }
}

async function dbCompleteSession(shuttleCount, shuttleCost) {
  try {
    const sessionId = getMySessionId();
    if (!sessionId) return;
    await sbPatch("sessions", `id=eq.${sessionId}`, {
      status:        "completed",
      ended_at:      new Date().toISOString(),
      shuttle_count: shuttleCount || null,
      shuttle_cost:  shuttleCost  || null
    });
    setMySessionId(null);
  } catch(e) { console.warn("dbCompleteSession error:", e.message); }
}

async function dbRecoverSession() {
  try {
    const club   = getMyClub();
    const player = getMyPlayer();
    if (!club.id || !player?.id) return null;
    const rows = await sbGet("sessions",
      `club_id=eq.${club.id}&started_by=eq.${player.id}&status=eq.live&order=started_at.desc&limit=1&select=id,rounds_data,started_at`
    );
    if (!rows || !rows.length) return null;
    const session = rows[0];
    const age = Date.now() - new Date(session.started_at).getTime();
    if (age > SESSION_TIMEOUT_MS) return null;
    return session;
  } catch(e) { return null; }
}

async function dbGetLiveSessions() {
  try {
    const isViewer = (typeof appMode !== "undefined") && appMode === "viewer";
    if (isViewer) {
      const player = getMyPlayer();
      if (!player) return [];
      const memberships = await sbGet("memberships", `player_id=eq.${player.id}&select=club_id`);
      const clubIds = memberships.map(m => m.club_id);
      if (!clubIds.length) return [];
      return await sbGet("sessions", `club_id=in.(${clubIds.join(",")})&status=eq.live&order=started_at.asc&select=id,rounds_data,started_by,started_at,club_id`) || [];
    } else {
      const club = getMyClub();
      if (!club.id) return [];
      return await sbGet("sessions", `club_id=eq.${club.id}&status=eq.live&order=started_at.asc&select=id,rounds_data,started_by,started_at`) || [];
    }
  } catch(e) { return []; }
}

async function dbGetPastSessions() {
  try {
    const isViewer = (typeof appMode !== "undefined") && appMode === "viewer";
    if (isViewer) {
      const player = getMyPlayer();
      if (!player) return [];
      const memberships = await sbGet("memberships", `player_id=eq.${player.id}&select=club_id`);
      const clubIds = memberships.map(m => m.club_id);
      if (!clubIds.length) return [];
      return await sbGet("sessions", `club_id=in.(${clubIds.join(",")})&status=eq.completed&order=ended_at.desc&limit=5&select=id,ended_at,started_by,rounds_data,club_id,shuttle_count,shuttle_cost`) || [];
    } else {
      const club = getMyClub();
      if (!club.id) return [];
      return await sbGet("sessions", `club_id=eq.${club.id}&status=eq.completed&order=ended_at.desc&limit=5&select=id,ended_at,started_by,rounds_data,shuttle_count,shuttle_cost`) || [];
    }
  } catch(e) { return []; }
}

async function dbForceCompleteSession(sessionId) {
  await sbPatch("sessions", `id=eq.${sessionId}`, { status: "completed", ended_at: new Date().toISOString() }).catch(() => {});
}

async function dbCleanupStaleSessions() {
  try {
    const club = getMyClub();
    if (!club.id) return;
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString();
    const rows = await sbGet("sessions", `club_id=eq.${club.id}&status=eq.live&started_at=lt.${cutoff}&select=id`);
    for (const s of (rows || [])) await dbForceCompleteSession(s.id);
  } catch(e) { /* silent */ }
}

async function saveRoundsToDb() { await dbSyncRoundsData(); }

/* ============================================================
   IS_PLAYING — via memberships
============================================================ */

async function dbClaimSessionSlots(playerNames) {
  const club = getMyClub();
  if (!club.id) return;
  for (const name of playerNames) {
    await sbPatch("memberships", `club_id=eq.${club.id}&nickname=ilike.${encodeURIComponent(name)}`, { is_playing: true }).catch(() => {});
  }
  dbInvalidateCache();
}

async function dbReleaseSessionSlots(playerNames) {
  const club = getMyClub();
  if (!club.id) return;
  for (const name of playerNames) {
    await sbPatch("memberships", `club_id=eq.${club.id}&nickname=ilike.${encodeURIComponent(name)}`, { is_playing: false }).catch(() => {});
  }
  dbInvalidateCache();
}

async function dbReleaseMySession() {
  const club = getMyClub();
  if (!club.id) return;
  await sbPatch("memberships", `club_id=eq.${club.id}&is_playing=eq.true`, { is_playing: false }).catch(() => {});
}

async function dbGetUnavailablePlayers() {
  try {
    const club = getMyClub();
    if (!club.id) return new Set();
    const rows = await sbGet("memberships", `club_id=eq.${club.id}&is_playing=eq.true&select=nickname`);
    return new Set((rows || []).map(r => r.nickname.trim().toLowerCase()));
  } catch(e) { return new Set(); }
}

/* ============================================================
   RANKINGS
============================================================ */

async function dbGetClubRanking(clubId) {
  return await sbGet("memberships", `club_id=eq.${clubId}&order=club_points.desc&select=nickname,club_rating,club_points,player_id`);
}

async function dbGetGlobalRanking() {
  return await sbGet("players", `order=global_points.desc&select=display_name,global_rating,global_points&limit=50`);
}

/* ============================================================
   CONNECTIVITY
============================================================ */

async function dbIsOnline() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clubs?limit=1`, { headers: SB_HEADERS });
    return res.ok;
  } catch { return false; }
}

/* ============================================================
   CACHE
============================================================ */

function dbInvalidateCache() {
  localStorage.removeItem(CACHE_PLAYERS);
  localStorage.removeItem(CACHE_TIMESTAMP);
}

/* ============================================================
   OFFLINE QUEUE
============================================================ */

function queuePush(updates) {
  try {
    const q = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
    updates.forEach(u => q.push({ ...u, timestamp: Date.now() }));
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
  } catch(e) {}
}
function queueClear() { localStorage.removeItem(SYNC_QUEUE_KEY); }
function queueGet()   { try { return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]"); } catch(e) { return []; } }

async function flushSyncQueue() {
  const pending = queueGet();
  if (!pending.length) return;
  const failed = [];
  for (const update of pending) {
    try { await dbSyncRatings([update]); } catch(e) { failed.push(update); }
  }
  if (failed.length) localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
  else queueClear();
}

/* ============================================================
   GLOBAL PLAYERS CACHE
============================================================ */

async function syncGlobalPlayersCache() {
  try {
    const club = getMyClub();
    if (!club.id) return;
    const memberships = await sbGet("memberships", `club_id=eq.${club.id}&select=nickname,club_rating,players(gender)`);
    const players = memberships.map(m => ({
      displayName: m.nickname,
      gender:      m.players?.gender || "Male",
      rating:      parseFloat(m.club_rating) || 1.0
    }));
    localStorage.setItem(CACHE_GLOBAL_PLAYERS, JSON.stringify(players));
  } catch(e) {}
}

function getGlobalPlayersCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_GLOBAL_PLAYERS) || "[]"); }
  catch(e) { return []; }
}

/* ============================================================
   LEGACY STUBS — keep so other files don't break during migration
============================================================ */

async function flushLiveSession()    { /* replaced by matches table */ }
async function cleanupLiveSessions() { await dbCleanupStaleSessions(); }
async function syncLiveSession()     { await dbSyncRoundsData(); }

function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  return user[0] + "***" + (user.length > 1 ? user.slice(-1) : "") + "@" + domain;
}

function isClubAdmin()  { return localStorage.getItem("kbrr_club_mode") === "admin"; }
function getClubMode()  { return localStorage.getItem("kbrr_club_mode") || null; }

// Legacy alias — old code calls getMyPlayer expecting {name, ...}
// New code stores player with display_name — bridge here
const _origGetMyPlayer = getMyPlayer;
