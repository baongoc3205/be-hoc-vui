// Phòng chơi cùng bạn bè: phòng chờ (mời bạn, bắt đầu) → ván chơi (máy chủ phân xử) → kết quả.
import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { go, setChildState, refreshChild, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { FriendsData, Look } from '../lib/types';
import { Btn, Dialog, Panel, Spinner, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Avatar, botLook } from '../games/board/common';
import { OnlineCards, OnlineLudo, OnlineQuiz, OnlineRace, OnlineWerewolf, type RoomView } from '../games/board/Online';
import { ROOM_GAMES, RACE_GAMES } from './Friends';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';
import { WithPresence, seenText } from '../ui/Presence';

export function seatLook(s: { look: Look | null; botIdx: number | null }): Look { return s.look ?? botLook(s.botIdx ?? 0); }

export function Room({ roomId }: { roomId: string }) {
  const T = useT(); const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const myLook = useApp((s) => s.cs?.child.look);
  const [v, setV] = useState<RoomView | null>(null);
  const [gone, setGone] = useState(false);
  const [friends, setFriends] = useState<FriendsData | null>(null);
  const [invited, setInvited] = useState<Set<number>>(new Set());
  const [resultSeen, setResultSeen] = useState(false);
  const alive = useRef(true);
  const base = `/children/${childId}/rooms/${roomId}`;

  useEffect(() => {
    alive.current = true;
    let t: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try { const r = await api.get<RoomView>(base); if (alive.current) setV(r); }
      catch (e) { if (e instanceof ApiError && (e.status === 404 || e.status === 403)) { setGone(true); return; } }
      if (alive.current) t = setTimeout(tick, document.visibilityState === 'visible' ? 900 : 4000);
    };
    void tick();
    return () => { alive.current = false; clearTimeout(t); };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (v?.status === 'lobby' && v.isHost && !friends) api.get<FriendsData>(`/children/${childId}/friends`).then(setFriends).catch(() => undefined); }, [v?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (v?.status === 'done') { sfx[v.result?.winners.includes(v.mySeat) ? 'levelup' : 'flip'](); setTimeout(() => refreshChild().then((cs) => cs && setChildState(cs)).catch(() => undefined), 800); } }, [v?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (body: Record<string, unknown>) => {
    try { const r = await api.post<RoomView>(`${base}/act`, body); setV(r); }
    catch (e) { sfx.wrong(); toast(errText(T, e), 'warn'); }
  };
  const leave = async () => { alive.current = false; try { await api.post(`${base}/leave`); } catch { /* bỏ qua */ } go('friends'); };
  const start = async () => { try { sfx.open(); setV(await api.post<RoomView>(`${base}/start`)); } catch (e) { toast(errText(T, e), 'warn'); } };
  const invite = async (fid: number) => { try { await api.post(`${base}/invite`, { friendId: fid }); setInvited((s) => new Set(s).add(fid)); sfx.pop(); toast(tr('Đã gửi lời mời!', 'Invite sent!')); } catch (e) { toast(errText(T, e), 'warn'); } };

  const g = ROOM_GAMES.find((x) => x.id === v?.game);
  const title = g ? `${g.icon} ${tr(...g.name)}` : '🎲';
  if (gone) return (
    <div className="screen"><Scene name="sakura" /><div className="screen-content"><TopBar title={title} to="friends" />
      <Panel><p className="shop-note">{tr('Phòng này đã đóng hoặc bé không còn trong phòng.', 'This room has closed or you are no longer in it.')}</p><Btn tone="lime" onClick={() => go('friends')}>{T.t('back')}</Btn></Panel>
    </div></div>
  );
  return (
    <div className="screen board-screen">
      <Scene name={v?.game === 'ludo' ? 'village' : v?.game === 'werewolf' ? 'night' : v?.game === 'cards' ? 'castle' : 'meadow'} />
      <div className="screen-content">
        <TopBar title={title} onBack={leave} />
        {!v ? <Spinner /> : v.status === 'lobby' ? (
          <div className="room-lobby">
            <Panel className="scroll-y" head={<h2>{tr('Phòng chờ', 'Waiting room')}</h2>}>
              <div className="room-code"><span>{tr('Mã phòng', 'Room code')}</span><b>{v.code}</b></div>
              <div className="room-seats">
                {Array.from({ length: RACE_GAMES.has(v.game) ? Math.max(2, v.seats.length) : v.opts.players }, (_, i) => v.seats[i]).map((s, i) => (
                  <div key={i} className={`room-seat ${s ? '' : 'empty'}`}>
                    {s ? <><Avatar look={seatLook(s)} size={58} /><b>{s.name}{s.you ? ` (${tr('bé', 'you')})` : ''}</b><small>{s.host ? tr('Chủ phòng', 'Host') : s.online ? tr('Sẵn sàng', 'Ready') : tr('Đang vào…', 'Joining…')}</small></>
                      : <><div className="seat-empty">🤖</div><b>{tr('Ghế trống', 'Empty')}</b><small>{tr('Bot sẽ chơi', 'A bot will play')}</small></>}
                  </div>
                ))}
              </div>
              {v.isHost ? <>
                {friends && friends.friends.length > 0 && <><div className="section-title">{tr('Mời bạn bè', 'Invite friends')}</div>
                  <div className="room-invites">{friends.friends.filter((f) => f.social).map((f) => <button key={f.id} type="button" className="room-inv" disabled={invited.has(f.id)} onClick={() => invite(f.id)}><WithPresence online={!!f.online} size={11}><Avatar look={f.look} size={36} /></WithPresence><span>{f.nickname}<small className={`pres-text ${f.online ? 'on' : ''}`}>{seenText(f, T.lang)}</small></span><i>{invited.has(f.id) ? '✓' : '+'}</i></button>)}</div></>}
                {friends && !friends.friends.length && <p className="muted">{tr('Bé chưa có bạn bè. Gửi mã phòng cho bạn hoặc bắt đầu chơi với bot.', 'No friends yet. Share the room code or start with bots.')}</p>}
                <div className="panel-actions"><Btn tone="gray" onClick={leave}>{tr('Huỷ phòng', 'Close room')}</Btn><Btn tone="orange" onClick={start}>{tr('Bắt đầu', 'Start')}</Btn></div>
              </> : <p className="shop-note">{tr('Chờ chủ phòng bắt đầu…', 'Waiting for the host to start…')}</p>}
            </Panel>
          </div>
        ) : (
          <div className="bg-stage">
            {v.game === 'cards' && <OnlineCards v={v} act={act} tr={tr} />}
            {v.game === 'ludo' && <OnlineLudo v={v} act={act} tr={tr} />}
            {v.game === 'quiz' && <OnlineQuiz v={v} act={act} tr={tr} lang={T.lang} />}
            {v.game === 'werewolf' && <OnlineWerewolf v={v} act={act} tr={tr} lang={T.lang} />}
            {RACE_GAMES.has(v.game) && v.game !== 'quiz' && myLook && <OnlineRace v={v} act={act} tr={tr} T={T} look={myLook} />}
          </div>
        )}
      </div>
      {v?.status === 'done' && !resultSeen && (
        <Dialog title={v.result?.winners.includes(v.mySeat) ? tr('🎉 Bé thắng rồi!', '🎉 You won!') : tr(`🏆 ${v.result?.winners.map((w) => v.seats[w].name).join(', ')} thắng!`, `🏆 ${v.result?.winners.map((w) => v.seats[w].name).join(', ')} won!`)} icon={null} onClose={() => setResultSeen(true)}
          actions={<><Btn tone="gray" onClick={() => setResultSeen(true)}>{tr('Xem lại bàn', 'See the board')}</Btn><Btn tone="orange" onClick={leave}>{tr('Rời phòng', 'Leave')}</Btn></>}>
          <div className="room-result">{v.seats.map((s, i) => <div key={i} className={v.result?.winners.includes(i) ? 'win' : ''}><Avatar look={seatLook(s)} size={44} /><b>{s.name}</b>{RACE_GAMES.has(v.game) && v.state && 'progress' in v.state && <span>{(v.state as { progress: { score: number }[] }).progress[i].score} {tr('điểm', 'pts')}</span>}</div>)}</div>
          {v.seats[v.mySeat]?.coins != null && <p style={{ marginBottom: 0 }}>{v.seats[v.mySeat].coins! > 0 ? tr(`Bé nhận được ${v.seats[v.mySeat].coins} xu.`, `You earned ${v.seats[v.mySeat].coins} coins.`) : tr('Ván ngắn hoặc bé đã nhận đủ xu hôm nay.', 'Short game, or today’s coins are used up.')}</p>}
        </Dialog>
      )}
    </div>
  );
}
