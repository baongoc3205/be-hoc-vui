// Ma sói chơi cùng bot. Bé là người chơi số 0, các bạn còn lại là bot có "suy luận" đơn giản:
// mỗi bot dân làng giữ một bảng nghi ngờ, cập nhật theo lời khai (nhất là lời Tiên tri), theo kết quả bỏ phiếu;
// bot sói biết đồng đội, tìm cách bắt Tiên tri và đổ tội cho dân lành, đôi khi giả làm Tiên tri.
// Vai: Sói, Tiên tri (soi 1 người mỗi đêm), Bảo vệ (che 1 người, không che cùng người 2 đêm liền),
// Phù thuỷ (1 bình cứu, 1 bình độc), Dân làng.

export const ROLE_INFO = {
  wolf: { icon: '🐺', name: { vi: 'Ma sói', en: 'Werewolf' }, goal: { vi: 'Mỗi đêm cùng bầy sói bắt một người. Thắng khi số sói bằng số dân.', en: 'Each night the pack takes one villager. Win when wolves equal villagers.' } },
  seer: { icon: '🔮', name: { vi: 'Tiên tri', en: 'Seer' }, goal: { vi: 'Mỗi đêm soi một người để biết có phải sói không.', en: 'Each night, check one player to see if they are a wolf.' } },
  guard: { icon: '🛡️', name: { vi: 'Bảo vệ', en: 'Guard' }, goal: { vi: 'Mỗi đêm che chở một người khỏi sói (không che cùng người hai đêm liền).', en: 'Each night protect one player (not the same player twice in a row).' } },
  witch: { icon: '🧪', name: { vi: 'Phù thuỷ', en: 'Witch' }, goal: { vi: 'Có 1 bình cứu người và 1 bình độc, mỗi bình dùng một lần.', en: 'One healing potion and one poison, each usable once.' } },
  villager: { icon: '🧑‍🌾', name: { vi: 'Dân làng', en: 'Villager' }, goal: { vi: 'Lắng nghe, suy luận và bỏ phiếu đuổi sói ra khỏi làng.', en: 'Listen, think and vote the wolves out of the village.' } },
};
export const SETUPS = {
  6: ['wolf', 'seer', 'guard', 'villager', 'villager', 'villager'],
  8: ['wolf', 'wolf', 'seer', 'guard', 'witch', 'villager', 'villager', 'villager'],
  10: ['wolf', 'wolf', 'wolf', 'seer', 'guard', 'witch', 'villager', 'villager', 'villager', 'villager'],
};
export const BOT_NAMES = ['Mimi', 'Bo', 'Mochi', 'Foxy', 'Kiwi', 'Na', 'Tí', 'Sóc', 'Bin', 'Bông', 'Mít', 'Su'];

const L = (vi, en) => ({ vi, en });
const pickOne = (rnd, a) => a[Math.floor(rnd() * a.length)];
function shuffle(rnd, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
const clamp = (x) => Math.max(0, Math.min(1, x));

export function newGame(n, rnd, { humanName = 'Bé', humanRole = 'random' } = {}) {
  const roles = shuffle(rnd, SETUPS[n] ?? SETUPS[8]);
  if (humanRole !== 'random' && roles.includes(humanRole)) { const k = roles.indexOf(humanRole); [roles[0], roles[k]] = [roles[k], roles[0]]; }
  const names = shuffle(rnd, BOT_NAMES);
  const players = roles.map((role, i) => ({ id: i, name: i === 0 ? humanName : names[i - 1], role, alive: true, human: i === 0 }));
  const sus = players.map((p) => players.map((q) => (p.id === q.id ? 0 : 0.2 + rnd() * 0.15)));
  const log = [{ day: 1, who: null, text: L('🌙 Màn đêm buông xuống — đêm thứ 1.', '🌙 Night falls — night 1.'), kind: 'phase' }];
  return { n: players.length, players, day: 1, phase: 'night', lastGuard: null, potions: { heal: true, kill: true }, checks: {}, claims: {}, accusations: [], log, winner: null, susM: sus };
}

const clone = (s) => ({ ...s, players: s.players.map((p) => ({ ...p })), checks: { ...s.checks }, claims: { ...s.claims }, accusations: s.accusations.slice(), log: s.log.slice(), potions: { ...s.potions } });
/** Chép cả bảng nghi ngờ susM[người xét][người bị xét] trước khi sửa. */
function withSus(s0, s) { s.susM = s0.susM.map((r) => r.slice()); return s; }

export const alive = (s) => s.players.filter((p) => p.alive);
export const isWolf = (s, id) => s.players[id].role === 'wolf';
export const roleOf = (s, id) => s.players[id].role;
export function checkWin(s) {
  const a = alive(s); const w = a.filter((p) => p.role === 'wolf').length;
  if (w === 0) return 'village';
  if (w >= a.length - w) return 'wolf';
  return null;
}
const say = (s, who, text, kind = 'say') => s.log.push({ day: s.day, who, text, kind });
const sys = (s, text, kind = 'sys') => s.log.push({ day: s.day, who: null, text, kind });
const villageBots = (s) => alive(s).filter((p) => !p.human && p.role !== 'wolf');

function bump(s, viewer, target, d) { if (viewer !== target) s.susM[viewer][target] = clamp(s.susM[viewer][target] + d); }

// ---------------- Ban đêm: lựa chọn của bot ----------------
export function botWolfTarget(s, rnd) {
  const cand = alive(s).filter((p) => p.role !== 'wolf');
  if (!cand.length) return null;
  const w = cand.map((p) => {
    let x = 1 + rnd();
    if (s.claims[p.id]) x += 6;                                           // bắt Tiên tri trước
    x += s.accusations.filter((a) => a.by === p.id && isWolf(s, a.target) && a.day >= s.day - 1).length * 3;
    return x;
  });
  return cand[w.indexOf(Math.max(...w))].id;
}
export function botGuardPick(s, gid, rnd) {
  const cand = alive(s).filter((p) => p.id !== s.lastGuard);
  const claimed = cand.find((p) => s.claims[p.id] && p.id !== gid && s.susM[gid][p.id] < 0.6);
  if (claimed && rnd() < 0.75) return claimed.id;
  if (cand.some((p) => p.id === gid) && rnd() < 0.3) return gid;
  return pickOne(rnd, cand).id;
}
export function botSeerPick(s, sid, rnd) {
  const cand = alive(s).filter((p) => p.id !== sid && !(p.id in s.checks));
  if (!cand.length) return null;
  const best = cand.map((p) => s.susM[sid][p.id] + rnd() * 0.4);
  return cand[best.indexOf(Math.max(...best))].id;
}
export function botWitch(s, wid, victim, rnd) {
  const heal = s.potions.heal && victim != null && (s.claims[victim] || victim === wid || rnd() < 0.5);
  let poison = null;
  if (s.potions.kill && s.day >= 2) {
    const cand = alive(s).filter((p) => p.id !== wid && p.id !== victim);
    const top = cand.sort((a, b) => s.susM[wid][b.id] - s.susM[wid][a.id])[0];
    if (top && s.susM[wid][top.id] > 0.75 && rnd() < 0.7) poison = top.id;
  }
  return { heal: !!heal, poison };
}

/** Lựa chọn ban đêm của mọi bot (những vai bé đang giữ thì bé tự chọn, truyền vào human). */
export function botNight(s, rnd) {
  const out = { victim: null, guard: null, heal: false, poison: null, check: null };
  const a = alive(s);
  const wolves = a.filter((p) => p.role === 'wolf');
  if (!wolves.some((p) => p.human)) out.victim = botWolfTarget(s, rnd);
  const g = a.find((p) => p.role === 'guard' && !p.human); if (g) out.guard = botGuardPick(s, g.id, rnd);
  const se = a.find((p) => p.role === 'seer' && !p.human); if (se) out.check = { seer: se.id, target: botSeerPick(s, se.id, rnd) };
  return out;
}

/** Kết thúc đêm. plan: { victim, guard, heal, poison, check: { seer, target } } */
export function resolveNight(s0, plan) {
  const s = withSus(s0, clone(s0));
  const deaths = [];
  if (plan.victim != null && plan.victim !== plan.guard && !plan.heal) deaths.push(plan.victim);
  if (plan.heal) s.potions.heal = false;
  if (plan.poison != null) { s.potions.kill = false; if (!deaths.includes(plan.poison)) deaths.push(plan.poison); }
  s.lastGuard = plan.guard ?? null;
  if (plan.check && plan.check.target != null) {
    const wolf = isWolf(s, plan.check.target);
    s.checks[plan.check.target] = wolf;
    s.susM[plan.check.seer][plan.check.target] = wolf ? 1 : 0;
  }
  sys(s, L(`☀️ Trời sáng, ngày thứ ${s.day}.`, `☀️ Morning of day ${s.day}.`), 'phase');
  if (!deaths.length) sys(s, L('Đêm qua làng bình yên, không ai bị bắt.', 'A quiet night — nobody was taken.'));
  for (const d of deaths) {
    s.players[d].alive = false;
    const r = ROLE_INFO[s.players[d].role];
    sys(s, L(`${s.players[d].name} đã rời làng trong đêm. ${s.players[d].name} là ${r.icon} ${r.name.vi}.`, `${s.players[d].name} left the village in the night. They were the ${r.icon} ${r.name.en}.`), 'death');
  }
  s.phase = 'day';
  s.winner = checkWin(s);
  return { s, deaths };
}

// ---------------- Ban ngày: thảo luận ----------------
function seerClaimers(s) { return Object.keys(s.claims).map(Number).filter((id) => s.players[id].alive); }
function accuse(s, by, target, strength, isClaim) {
  s.accusations.push({ by, target, day: s.day });
  const claimers = seerClaimers(s);
  const cred = isClaim ? (claimers.length <= 1 ? 0.5 : 0.25) : 0.12;
  for (const b of villageBots(s)) {
    if (b.id === by || b.id === target) continue;
    if (b.role === 'seer' && target in s.checks) continue;              // Tiên tri tin vào điều mình đã soi
    bump(s, b.id, target, strength * cred * (s.susM[b.id][by] < 0.5 ? 1 : 0.5));
  }
}
function clear(s, by, target) {
  const claimers = seerClaimers(s);
  for (const b of villageBots(s)) if (b.id !== target && !(b.role === 'seer' && target in s.checks)) bump(s, b.id, target, claimers.length <= 1 ? -0.3 : -0.1);
}
function claimSeer(s, id) {
  const before = seerClaimers(s);
  s.claims[id] = { day: s.day };
  if (before.length) for (const b of villageBots(s)) for (const c of [...before, id]) if (b.id !== c && !(b.role === 'seer' && b.id === c)) {
    if (b.role === 'seer') { if (c !== b.id) bump(s, b.id, c, 0.9); }  // Tiên tri thật biết kẻ kia nói dối
    else s.susM[b.id][c] = Math.max(s.susM[b.id][c], 0.45);
  }
}
/** Người nghi ngờ nhất theo bot b (trong số người còn sống, trừ chính mình). */
function topSus(s, b) {
  const cand = alive(s).filter((p) => p.id !== b);
  return cand.sort((x, y) => s.susM[b][y.id] - s.susM[b][x.id])[0];
}
const susLine = (s, rnd, name) => pickOne(rnd, s.day > 1 && rnd() < 0.3 ? LINES.susLater : LINES.sus)(name);
const LINES = {
  sus: [(n) => L(`Tớ thấy ${n} cứ ấp úng, đáng nghi lắm!`, `${n} keeps mumbling — very suspicious!`), (n) => L(`Tớ nghi ${n} đấy.`, `I suspect ${n}.`), (n) => L(`${n} im lặng quá, có gì giấu tụi mình không?`, `${n} is too quiet — hiding something?`),
    (n) => L(`Đêm qua tớ nghe tiếng sột soạt gần nhà ${n}...`, `Last night I heard rustling near ${n}’s house...`), (n) => L(`Tớ không tin ${n} lắm.`, `I don’t really trust ${n}.`), (n) => L(`Sao ${n} cứ nhìn đi chỗ khác thế nhỉ?`, `Why does ${n} keep looking away?`)],
  susLater: [(n) => L(`Hôm qua ${n} bỏ phiếu lạ lắm.`, `${n} voted strangely yesterday.`), (n) => L(`${n} cứ bênh người vừa lộ là sói, đáng ngờ!`, `${n} kept defending the wolf — suspicious!`)],
  calm: [() => L('Tớ chưa thấy ai lạ cả, mọi người nói tiếp đi.', 'I haven’t spotted anyone yet, keep talking.'), () => L('Bình tĩnh nào, đừng đổ oan cho ai nhé.', 'Calm down, let’s not blame the wrong person.'), () => L('Tớ là dân lành mà!', 'I’m just a villager!'),
    () => L('Tiên tri ơi, nếu bạn biết gì thì nói đi!', 'Seer, if you know something, tell us!'), () => L('Tớ sẽ nghe thêm rồi mới bỏ phiếu.', 'I’ll listen more before I vote.'), () => L('Làng mình phải đoàn kết nhé!', 'Let’s stick together, village!')],
};

/** Bot lần lượt phát biểu. Trả về state mới (lời nói nằm trong log, kind 'say'). */
export function dayTalk(s0, rnd) {
  const s = withSus(s0, clone(s0));
  const order = shuffle(rnd, alive(s).filter((p) => !p.human));
  for (const p of order) {
    const claimers = seerClaimers(s);
    if (p.role === 'seer') {
      const wolves = Object.entries(s.checks).filter(([id, w]) => w && s.players[id].alive).map(([id]) => Number(id));
      const clean = Object.entries(s.checks).filter(([id, w]) => !w && s.players[id].alive).map(([id]) => Number(id));
      if (wolves.length && (s.claims[p.id] || rnd() < 0.6)) {
        if (!s.claims[p.id]) claimSeer(s, p.id);
        const t = wolves[0];
        say(s, p.id, L(`Tớ là Tiên tri! Tớ đã soi: ${s.players[t].name} là SÓI!`, `I’m the Seer! I checked ${s.players[t].name}: a WOLF!`), 'claim');
        accuse(s, p.id, t, 1, true);
        continue;
      }
      if (s.claims[p.id] && clean.length) { const t = clean[clean.length - 1]; say(s, p.id, L(`Tớ soi ${s.players[t].name} rồi, là dân lành.`, `I checked ${s.players[t].name}: innocent.`)); clear(s, p.id, t); continue; }
    }
    if (p.role === 'wolf') {
      const realClaim = claimers.find((c) => c !== p.id && !isWolf(s, c));
      const accusedWolf = realClaim != null && s.accusations.some((a) => a.by === realClaim && isWolf(s, a.target) && a.day === s.day);
      if (accusedWolf && claimers.length === 1 && rnd() < 0.7) {
        claimSeer(s, p.id);
        say(s, p.id, L(`Đừng tin! Tớ mới là Tiên tri thật, chính ${s.players[realClaim].name} là sói!`, `Don’t believe it! I’m the real Seer — ${s.players[realClaim].name} is the wolf!`), 'claim');
        accuse(s, p.id, realClaim, 1, true);
        continue;
      }
      const targets = alive(s).filter((q) => q.role !== 'wolf');
      if (targets.length && rnd() < 0.8) {
        const avg = (id) => villageBots(s).reduce((a, b) => a + s.susM[b.id][id], 0);
        const t = targets.sort((x, y) => avg(y.id) - avg(x.id) + (rnd() - 0.5) * 0.3)[0];
        say(s, p.id, susLine(s, rnd, t.name)); accuse(s, p.id, t.id, 1, false);
      } else say(s, p.id, pickOne(rnd, LINES.calm)());
      continue;
    }
    const t = topSus(s, p.id);
    if (t && s.susM[p.id][t.id] > (s.day === 1 ? 0.55 : 0.45)) { say(s, p.id, susLine(s, rnd, t.name)); accuse(s, p.id, t.id, 1, false); }
    else say(s, p.id, pickOne(rnd, LINES.calm)());
  }
  return s;
}

/** Bé phát biểu: kind 'accuse' | 'clear' | 'claimWolf' (nhận là Tiên tri, tố ai là sói) | 'claimClean'. */
export function humanSay(s0, kind, target) {
  const s = withSus(s0, clone(s0));
  const n = s.players[target].name;
  if (kind === 'accuse') { say(s, 0, L(`Tớ nghi ${n} là sói!`, `I think ${n} is a wolf!`)); accuse(s, 0, target, 1.4, false); }
  if (kind === 'clear') { say(s, 0, L(`Tớ tin ${n} là người tốt.`, `I trust ${n}.`)); for (const b of villageBots(s)) bump(s, b.id, target, -0.08); }
  if (kind === 'claimWolf') { claimSeer(s, 0); say(s, 0, L(`Tớ là Tiên tri! ${n} là SÓI!`, `I’m the Seer! ${n} is a WOLF!`), 'claim'); accuse(s, 0, target, 1, true); }
  if (kind === 'claimClean') { claimSeer(s, 0); say(s, 0, L(`Tớ là Tiên tri, ${n} là dân lành.`, `I’m the Seer, ${n} is innocent.`), 'claim'); clear(s, 0, target); }
  return s;
}

// ---------------- Bỏ phiếu ----------------
export function botVotes(s, rnd) {
  const votes = {};
  const a = alive(s);
  const nonWolves = a.filter((p) => p.role !== 'wolf');
  // bầy sói dồn phiếu cho người nguy hiểm nhất (Tiên tri) hoặc người đang bị cả làng nghi
  let wolfPick = null;
  if (nonWolves.length) {
    const avg = (id) => villageBots(s).reduce((x, b) => x + s.susM[b.id][id], 0);
    const claimed = nonWolves.find((p) => s.claims[p.id]);
    wolfPick = claimed ? claimed.id : nonWolves.sort((x, y) => avg(y.id) - avg(x.id))[0].id;
  }
  for (const p of a) {
    if (p.human) continue;
    if (p.role === 'wolf') { votes[p.id] = wolfPick; continue; }
    const t = topSus(s, p.id);
    votes[p.id] = t && s.susM[p.id][t.id] > 0.3 && rnd() > 0.1 ? t.id : null;
  }
  return votes;
}

/** Đếm phiếu (votes: { người bỏ: người bị bỏ | null }). Hoà phiếu thì không ai bị đuổi. */
export function resolveVote(s0, votes) {
  const s = withSus(s0, clone(s0));
  const tally = {};
  for (const t of Object.values(votes)) if (t != null) tally[t] = (tally[t] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(tally));
  const tops = Object.keys(tally).filter((k) => tally[k] === max).map(Number);
  let out = null;
  if (max > 0 && tops.length === 1) out = tops[0];
  if (out == null) sys(s, L('Phiếu bị hoà — hôm nay không ai phải rời làng.', 'A tie — nobody leaves today.'));
  else {
    s.players[out].alive = false;
    const r = ROLE_INFO[s.players[out].role]; const wolf = r === ROLE_INFO.wolf;
    sys(s, L(`Cả làng mời ${s.players[out].name} rời làng (${max} phiếu). ${s.players[out].name} là ${r.icon} ${r.name.vi}!`, `The village sends ${s.players[out].name} away (${max} votes). They were the ${r.icon} ${r.name.en}!`), wolf ? 'good' : 'death');
    for (const b of villageBots(s)) for (const [v, t] of Object.entries(votes)) if (t === out) bump(s, b.id, Number(v), wolf ? -0.15 : 0.2);
    // ai từng tố đúng/sai người vừa lộ vai cũng được tin hơn/kém đi
    for (const acc of s.accusations.filter((x) => x.target === out)) for (const b of villageBots(s)) bump(s, b.id, acc.by, wolf ? -0.2 : 0.15);
  }
  s.winner = checkWin(s);
  if (!s.winner) { s.day++; s.phase = 'night'; sys(s, L(`🌙 Màn đêm buông xuống — đêm thứ ${s.day}.`, `🌙 Night falls — night ${s.day}.`), 'phase'); }
  else s.phase = 'end';
  return { s, out, tally };
}
