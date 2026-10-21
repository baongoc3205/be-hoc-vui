// Trò chơi cùng bot (Bài màu sắc, Cá ngựa, Ma sói): chọn luật → chơi → kết quả.
// Ván chơi chạy trên máy; máy chủ ghi thời gian chơi (tính vào giới hạn giờ mỗi ngày) và thưởng ít xu.
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { go, setChildState, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChildState } from '../lib/types';
import { Btn, Dialog, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { GameTile } from '../ui/Icons';
import { sfx } from '../lib/sfx';
import { burstAt } from '../lib/fx';
import { CardsGame } from '../games/board/CardsGame';
import { LudoGame } from '../games/board/LudoGame';
import { WerewolfGame } from '../games/board/WerewolfGame';
import { createRoomAndInvite } from './Friends';
import { errText } from './Auth';
import { makeTr, type Level } from '../games/board/common';
import { QuizPrompt, useQuestions, type Ask, type LQuestion } from '../games/board/LearnQuiz';
import { ROLE_INFO } from '../../../shared/board/werewolf.js';
import type { Role } from '../../../shared/board/werewolf.js';

export type BoardId = 'cards' | 'ludo' | 'werewolf';
export const BOARD_GAMES: { id: BoardId; icon: string; name: [string, string]; desc: [string, string] }[] = [
  { id: 'cards', icon: '🃏', name: ['Bài Màu Sắc', 'Colour Cards'], desc: ['Luật kiểu UNO, trả lời đúng để chặn +2 và chọn màu', 'UNO-style rules — answer questions to block +2 and pick colours'] },
  { id: 'ludo', icon: '🐴', name: ['Cá ngựa', 'Ludo'], desc: ['Gieo xúc xắc, đá ngựa; trả lời đúng để ra quân, gieo thêm', 'Roll, bump rivals — answer questions to get out and roll again'] },
  { id: 'werewolf', icon: '🐺', name: ['Ma sói', 'Werewolf'], desc: ['Suy luận tìm sói, giải đố để nhận gợi ý', 'Find the wolves — solve puzzles for clues'] },
];

interface Opts { players: number; level: Level; exitOne: boolean; role: Role | 'random'; learn: boolean; subject: string }
const DEFAULT: Record<BoardId, Opts> = {
  cards: { players: 4, level: 'normal', exitOne: false, role: 'random', learn: true, subject: 'any' },
  ludo: { players: 4, level: 'normal', exitOne: false, role: 'random', learn: true, subject: 'any' },
  werewolf: { players: 8, level: 'normal', exitOne: false, role: 'random', learn: true, subject: 'any' },
};
const loadOpts = (g: BoardId): Opts => { try { return { ...DEFAULT[g], ...JSON.parse(localStorage.getItem(`bhv_board_${g}`) ?? '{}') }; } catch { return DEFAULT[g]; } };
const saveOpts = (g: BoardId, o: Opts) => { try { localStorage.setItem(`bhv_board_${g}`, JSON.stringify(o)); } catch { /* bỏ qua */ } };

function Choice<V extends string | number>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  return (
    <div className="bg-choice"><span>{label}</span>
      <div className="chips">{options.map(([v, t]) => <button key={String(v)} type="button" className={`chip ${value === v ? 'on' : ''}`} onClick={() => { sfx.tap(); onChange(v); }}>{t}</button>)}</div>
    </div>
  );
}

export function Board({ game }: { game: BoardId }) {
  const T = useT();
  const tr = makeTr(T.lang);
  const cs = useApp((s) => s.cs)!;
  const childId = useApp((s) => s.childId);
  const info = BOARD_GAMES.find((g) => g.id === game) ?? BOARD_GAMES[0];
  const [opts, setOpts] = useState<Opts>(() => loadOpts(info.id));
  const [run, setRun] = useState(0);         // 0 = đang chọn luật; >0 = mã ván
  const [result, setResult] = useState<{ won: boolean; coins: number; short: boolean; right: number; total: number } | null>(null);
  const started = useRef<number | null>(null);
  const me = { name: cs.child.nickname, look: cs.child.look };
  const limited = cs.today.limit > 0 && cs.today.minutes >= cs.today.limit;
  const set = (p: Partial<Opts>) => { const o = { ...opts, ...p }; setOpts(o); saveOpts(info.id, o); };
  // ---- học kết hợp: hỏi một câu đúng lớp, trả về đúng/sai ----
  const catalog = useApp((s) => s.catalog)!;
  const qs = useQuestions(opts.subject, opts.learn);
  const [asking, setAsking] = useState<{ q: LQuestion; reason: string; resolve: (ok: boolean) => void } | null>(null);
  const tally = useRef({ right: 0, total: 0 });
  const ask: Ask = opts.learn ? (reason) => new Promise<boolean>((resolve) => { const q = qs.next(); if (!q) { resolve(false); return; } setAsking({ q, reason, resolve }); }) : null;
  const answered = (ok: boolean) => { if (!asking) return; tally.current.total++; if (ok) tally.current.right++; const r = asking.resolve; setAsking(null); r(ok); };

  const report = async (won: boolean) => {
    const secs = started.current ? (Date.now() - started.current) / 1000 : 0; started.current = null;
    if (secs < 5) return { coins: 0, secs };
    try { const r = await api.post<{ coins: number; state: ChildState }>(`/children/${childId}/board`, { game: info.id, seconds: Math.round(secs), won }); setChildState(r.state); return { coins: r.coins, secs }; }
    catch { return { coins: 0, secs }; }
  };
  // rời trang giữa ván vẫn ghi thời gian đã chơi
  useEffect(() => () => { if (started.current) void report(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (limited) { sfx.wrong(); toast(T.t('err_DAILY_LIMIT'), 'warn'); return; }
    sfx.open(); started.current = Date.now(); setResult(null); tally.current = { right: 0, total: 0 }; setRun((n) => n + 1);
  };
  const end = async (won: boolean) => { const r = await report(won); setResult({ won, coins: r.coins, short: r.secs < 60, ...tally.current }); };

  return (
    <div className="screen board-screen">
      <Scene name={game === 'werewolf' ? 'night' : game === 'ludo' ? 'village' : 'castle'} />
      <div className="screen-content">
        <TopBar title={`${info.icon} ${tr(...info.name)}`} to="arcade" onBack={run ? () => { if (started.current) void report(false); setRun(0); } : undefined} />
        {!run ? (
          <div className="bg-setup panel">
            <div className="bg-setup-head"><GameTile game={info.id} tone={{ cards: 'rose', ludo: 'science', werewolf: 'english' }[info.id]} size={72} /><div><h2>{tr(...info.name)}</h2><p>{tr(...info.desc)}</p></div></div>
            {game === 'cards' && <>
              <Choice label={tr('Số người chơi', 'Players')} value={opts.players} options={[[2, tr('2 (bé + 1 bot)', '2 (you + 1 bot)')], [3, '3'], [4, '4']]} onChange={(v) => set({ players: v })} />
              <Choice label={tr('Bot', 'Bots')} value={opts.level} options={[['easy', tr('Dễ', 'Easy')], ['normal', tr('Khéo', 'Clever')]]} onChange={(v) => set({ level: v })} />
              <ul className="bg-rules">
                <li>{tr('Ra lá cùng màu hoặc cùng số/ký hiệu với lá trên bàn. Không ra được thì bốc 1 lá.', 'Play a card matching the colour or symbol. If you can’t, draw one.')}</li>
                <li>{tr('⦸ mất lượt · ⇄ đổi chiều · +2 người kế bốc 2 · ✦ đổi màu · +4 đổi màu và người kế bốc 4 (chỉ khi hết lá cùng màu).', '⦸ skip · ⇄ reverse · +2 next draws 2 · ✦ wild · +4 wild and next draws 4 (only with no matching colour).')}</li>
                <li>{tr('Còn 2 lá thì nhớ bấm “Một lá!” trước khi đánh, quên thì bốc phạt 2 lá.', 'With 2 cards left, tap “Last card!” before playing or draw 2 as a penalty.')}</li>
              </ul>
            </>}
            {game === 'ludo' && <>
              <Choice label={tr('Số người chơi', 'Players')} value={opts.players} options={[[2, '2'], [3, '3'], [4, '4']]} onChange={(v) => set({ players: v })} />
              <Choice label={tr('Bot', 'Bots')} value={opts.level} options={[['easy', tr('Dễ', 'Easy')], ['normal', tr('Khéo', 'Clever')]]} onChange={(v) => set({ level: v })} />
              <Choice label={tr('Ra chuồng khi gieo', 'Leave the stable on')} value={opts.exitOne ? 1 : 0} options={[[0, tr('Chỉ số 6', 'Only 6')], [1, tr('Số 1 hoặc 6', '1 or 6')]]} onChange={(v) => set({ exitOne: v === 1 })} />
              <ul className="bg-rules">
                <li>{tr('Gieo 6 hoặc đá được ngựa đối thủ thì được gieo thêm. Ba lần 6 liền thì mất lượt.', 'Roll a 6 or bump a rival to roll again. Three 6s in a row loses the turn.')}</li>
                <li>{tr('Ô có ★ và ô xuất phát là ô an toàn, không bị đá.', 'Star squares and start squares are safe.')}</li>
                <li>{tr('Về đích phải gieo đúng số.', 'You need the exact number to get home.')}</li>
              </ul>
            </>}
            {game === 'werewolf' && <>
              <Choice label={tr('Số người trong làng', 'Village size')} value={opts.players} options={[[6, tr('6 (1 sói)', '6 (1 wolf)')], [8, tr('8 (2 sói)', '8 (2 wolves)')], [10, tr('10 (3 sói)', '10 (3 wolves)')]]} onChange={(v) => set({ players: v })} />
              <Choice label={tr('Vai của bé', 'Your role')} value={opts.role} options={[['random', tr('Ngẫu nhiên', 'Random')], ...(['villager', 'wolf', 'seer', 'guard', 'witch'] as Role[]).filter((r) => r !== 'witch' || opts.players > 6).map((r) => [r, `${ROLE_INFO[r].icon} ${ROLE_INFO[r].name[T.lang]}`] as [Role, string])]} onChange={(v) => set({ role: v })} />
              <ul className="bg-rules">
                {(['wolf', 'seer', 'guard', 'witch', 'villager'] as Role[]).map((r) => <li key={r}><b>{ROLE_INFO[r].icon} {ROLE_INFO[r].name[T.lang]}:</b> {ROLE_INFO[r].goal[T.lang]}</li>)}
                <li>{tr('Ban ngày cả làng bàn bạc rồi bỏ phiếu mời một người rời làng. Dân thắng khi hết sói; sói thắng khi số sói bằng số dân.', 'By day everyone talks, then votes someone out. The village wins when no wolves remain; wolves win when they equal the villagers.')}</li>
              </ul>
            </>}
            <Choice label={tr('Học kết hợp', 'Learn while playing')} value={opts.learn ? 1 : 0} options={[[1, tr('Bật — có câu hỏi', 'On — with questions')], [0, tr('Tắt — chơi thuần', 'Off — just play')]]} onChange={(v) => set({ learn: v === 1 })} />
            {opts.learn && <Choice label={tr('Câu hỏi môn', 'Question subject')} value={opts.subject} options={[['any', tr('Trộn tất cả', 'Mix')], ...catalog.subjects.map((x) => [x.id, T.tx(x.name)] as [string, string])]} onChange={(v) => set({ subject: v })} />}
            {opts.learn && <p className="bg-learn">🧠 {game === 'cards' ? tr('Bị +2/+4: trả lời đúng để chặn, không phải bốc. Đánh lá đổi màu: trả lời đúng mới được tự chọn màu (sai thì màu ngẫu nhiên).', 'Hit by +2/+4: answer right to block it. Wild card: answer right to pick the colour (otherwise it’s random).') : game === 'ludo' ? tr('Không gieo được số ra quân: trả lời đúng để vẫn ra được 1 ngựa. Đi vào ô ★: trả lời đúng để được gieo thêm.', 'Can’t roll out of the stable? Answer right to bring a horse out anyway. Land on a ★: answer right to roll again.') : tr('Mỗi ngày giải tối đa 2 câu đố để nhận gợi ý tìm sói (gợi ý luôn đúng).', 'Each day, solve up to 2 puzzles to get clues about the wolves (clues are always true).')} {tr('Bot cũng phải trả lời câu hỏi.', 'Bots have to answer too.')}</p>}
            {limited && <p className="bg-warn">{T.t('err_DAILY_LIMIT')}</p>}
            <div className="panel-actions">
              <Btn tone="gray" onClick={() => go('arcade')}>{T.t('back')}</Btn>
              {game !== 'werewolf' && <Btn tone="cream" disabled={limited} onClick={() => createRoomAndInvite(game, undefined, { players: opts.players, level: opts.level, exitOne: opts.exitOne }).catch((e) => toast(errText(T, e), 'warn'))}>👫 {tr('Chơi với bạn bè', 'Play with friends')}</Btn>}
              <Btn tone="orange" disabled={limited} onClick={start}>{tr('Chơi với bot', 'Play with bots')}</Btn>
            </div>
          </div>
        ) : (
          <div className="bg-stage" key={run}>
            {game === 'cards' && <CardsGame players={opts.players} level={opts.level} tr={tr} me={me} onEnd={end} ask={ask} />}
            {game === 'ludo' && <LudoGame players={opts.players} level={opts.level} exitOn={opts.exitOne ? [1, 6] : [6]} tr={tr} me={me} onEnd={end} ask={ask} />}
            {game === 'werewolf' && <WerewolfGame players={opts.players} role={opts.players === 6 && opts.role === 'witch' ? 'random' : opts.role} tr={tr} lang={T.lang} me={me} onEnd={end} ask={ask} />}
          </div>
        )}
      </div>
      {asking && <QuizPrompt key={asking.q.id} q={asking.q} reason={asking.reason} tr={tr} lang={T.lang} onDone={answered} />}
      {result && (
        <Dialog title={result.won ? tr('🎉 Bé thắng rồi!', '🎉 You won!') : tr('Ván sau cố lên nhé!', 'Better luck next time!')} icon={result.won ? 'trophy' : 'flower'} onClose={() => setResult(null)}
          actions={<><Btn tone="gray" onClick={() => { setResult(null); setRun(0); }}>{tr('Đổi luật', 'Change rules')}</Btn><Btn tone="orange" onClick={(e) => { burstAt(e.currentTarget, 'stars', 10); start(); }}>{T.t('playAgain')}</Btn></>}>
          {result.total > 0 && <p className="lq-score">🧠 {tr(`Bé trả lời đúng ${result.right}/${result.total} câu hỏi`, `You answered ${result.right}/${result.total} questions correctly`)}</p>}
          <p style={{ margin: 0 }}>{result.coins > 0 ? tr(`Bé nhận được ${result.coins} xu.`, `You earned ${result.coins} coins.`) : result.short ? tr('Ván chơi dưới 1 phút nên chưa có xu thưởng.', 'Games under a minute don’t earn coins.') : tr('Hôm nay bé đã nhận đủ xu từ trò chơi này rồi — chơi tiếp cho vui nhé!', 'You’ve collected today’s game coins — keep playing for fun!')}</p>
        </Dialog>
      )}
    </div>
  );
}
