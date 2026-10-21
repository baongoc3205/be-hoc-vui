// Bạn bè: mã kết bạn, lời mời, danh sách bạn; trò chuyện; mời chơi chung.
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getState, go, refreshSocial, toast, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { ChatMsg, FriendCard, FriendsData } from '../lib/types';
import { Btn, Dialog, Panel, Spinner, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { Avatar } from '../games/board/common';
import { ProfileDialog, ReportDialog } from '../ui/ProfileDialog';
import { errText } from './Auth';
import { sfx } from '../lib/sfx';

type Tr = (vi: string, en: string) => string;
export const ROOM_GAMES: { id: 'cards' | 'ludo' | 'quiz'; icon: string; name: [string, string] }[] = [
  { id: 'quiz', icon: '🧠', name: ['Thi đố vui', 'Quiz duel'] },
  { id: 'cards', icon: '🃏', name: ['Bài Màu Sắc', 'Colour Cards'] },
  { id: 'ludo', icon: '🐴', name: ['Cá ngựa', 'Ludo'] },
];
const gameName = (id: string, tr: Tr) => { const g = ROOM_GAMES.find((x) => x.id === id); return g ? `${g.icon} ${tr(...g.name)}` : id; };

/** Tạo phòng và (nếu có) mời ngay một bạn. */
export async function createRoomAndInvite(game: string, friendId?: number, opts: Record<string, unknown> = {}) {
  const { childId } = getState();
  const room = await api.post<{ id: string }>(`/children/${childId}/rooms`, { game, opts });
  if (friendId) await api.post(`/children/${childId}/rooms/${room.id}/invite`, { friendId });
  go(`room/${room.id}`);
}
export async function joinRoomByCode(code: string) {
  const { childId } = getState();
  const room = await api.post<{ id: string }>(`/children/${childId}/rooms/join`, { code });
  go(`room/${room.id}`);
}

export function GamePicker({ friend, onClose }: { friend?: FriendCard; onClose: () => void }) {
  const T = useT(); const tr: Tr = (vi, en) => (T.lang === 'en' ? en : vi);
  const start = async (g: string) => { try { sfx.open(); await createRoomAndInvite(g, friend?.id); onClose(); } catch (e) { toast(errText(T, e), 'warn'); } };
  return (
    <Dialog title={friend ? tr(`Chơi cùng ${friend.nickname}`, `Play with ${friend.nickname}`) : tr('Tạo phòng chơi', 'Create a room')} icon={null} onClose={onClose} actions={<Btn tone="gray" onClick={onClose}>{T.t('cancel')}</Btn>}>
      <div className="pick-games">{ROOM_GAMES.map((g) => <button key={g.id} type="button" className="pick-game" onClick={() => start(g.id)}><span>{g.icon}</span><b>{tr(...g.name)}</b></button>)}</div>
      <p className="muted" style={{ marginBottom: 0 }}>{tr('Ghế còn trống sẽ có bạn bot chơi cùng.', 'Empty seats are filled by bots.')}</p>
    </Dialog>
  );
}

export function Friends({ tab }: { tab?: string }) {
  const T = useT(); const tr: Tr = (vi, en) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const [d, setD] = useState<FriendsData | null>(null);
  const [code, setCode] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [profile, setProfile] = useState<number | null>(null);
  const [picker, setPicker] = useState<FriendCard | null | undefined>(undefined);
  const load = () => api.get<FriendsData>(`/children/${childId}/friends`).then((x) => { setD(x); void refreshSocial(); }).catch(() => setD(null));
  useEffect(() => { void load(); const iv = setInterval(load, 12_000); return () => clearInterval(iv); }, [childId]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = async () => {
    try { const r = await api.post<{ status: string; friend: FriendCard }>(`/children/${childId}/friends`, { code }); sfx.open(); toast(r.status === 'friends' ? tr(`Đã thành bạn với ${r.friend.nickname}!`, `You and ${r.friend.nickname} are friends!`) : tr(`Đã gửi lời mời tới ${r.friend.nickname}`, `Request sent to ${r.friend.nickname}`)); setCode(''); void load(); }
    catch (e) { sfx.wrong(); toast(errText(T, e), 'warn'); }
  };
  const respond = async (id: number, ok: boolean) => { try { await api.post(`/children/${childId}/friends/${id}/${ok ? 'accept' : 'decline'}`); sfx.pop(); void load(); } catch (e) { toast(errText(T, e), 'warn'); } };
  const copy = () => { try { void navigator.clipboard.writeText(d?.code ?? ''); toast(tr('Đã chép mã!', 'Code copied!')); } catch { /* bỏ qua */ } };
  void tab;

  return (
    <div className="screen friends">
      <Scene name="sakura" />
      <div className="screen-content">
        <TopBar title={`👫 ${T.t('friends')}`} to="lobby" />
        {!d ? <Spinner /> : (
          <div className="friends-layout">
            <Panel className="scroll-y" head={<h2>{tr('Mã kết bạn của bé', 'Your friend code')}</h2>}>
              {!d.social ? <p className="shop-note">{tr('Phụ huynh đang tắt kết bạn và nhắn tin cho bé. Bé vẫn xem được bảng xếp hạng nhé!', 'A parent has turned off friends and chat. You can still see the rankings!')}</p> : <>
                <button type="button" className="my-code" onClick={copy} aria-label={tr('Chép mã', 'Copy code')}>{d.code}</button>
                <p className="muted" style={{ margin: 0 }}>{tr('Đưa mã này cho bạn ở lớp để kết bạn. Đừng đưa mã cho người lạ trên mạng nhé!', 'Share this code with classmates. Don’t give it to strangers online!')}</p>
                <div className="add-row">
                  <input className="input" value={code} maxLength={8} placeholder={tr('Nhập mã của bạn', 'Friend’s code')} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter' && code.length >= 6) void add(); }} />
                  <Btn tone="lime" disabled={code.length < 6} onClick={add}>{tr('Kết bạn', 'Add')}</Btn>
                </div>
                <div className="add-row">
                  <input className="input" value={roomCode} maxLength={6} placeholder={tr('Mã phòng chơi', 'Room code')} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />
                  <Btn tone="orange" disabled={roomCode.length < 5} onClick={() => joinRoomByCode(roomCode).catch((e) => toast(errText(T, e), 'warn'))}>{tr('Vào phòng', 'Join')}</Btn>
                </div>
                <Btn tone="cream" onClick={() => setPicker(null)}>🎲 {tr('Tạo phòng chơi', 'Create a room')}</Btn>
                {d.incoming.length > 0 && <><div className="section-title">{tr('Lời mời kết bạn', 'Friend requests')}</div>
                  {d.incoming.map((f) => <div key={f.id} className="friend-row"><button type="button" className="fr-main" onClick={() => setProfile(f.id)}><Avatar look={f.look} size={46} /><span><b>{f.nickname}</b><small>{T.t('gradeN', { n: f.grade })} · Lv. {f.level}</small></span></button><Btn tone="lime" size="sm" onClick={() => respond(f.id, true)}>{tr('Đồng ý', 'Accept')}</Btn><Btn tone="gray" size="sm" onClick={() => respond(f.id, false)}>{tr('Từ chối', 'Decline')}</Btn></div>)}</>}
                {d.outgoing.length > 0 && <><div className="section-title">{tr('Đang chờ bạn đồng ý', 'Waiting for reply')}</div>
                  <div className="chips">{d.outgoing.map((f) => <span key={f.id} className="chip">{f.nickname}</span>)}</div></>}
              </>}
            </Panel>
            <Panel className="scroll-y" head={<h2>{tr(`Bạn bè (${d.friends.length})`, `Friends (${d.friends.length})`)}</h2>}>
              {!d.friends.length && <p className="shop-note">{tr('Bé chưa có bạn nào. Nhập mã của bạn cùng lớp hoặc tìm bạn ở Bảng xếp hạng nhé!', 'No friends yet. Enter a classmate’s code or find someone on the rankings!')}</p>}
              {d.friends.map((f) => (
                <div key={f.id} className="friend-row">
                  <button type="button" className="fr-main" onClick={() => go(`chat/${f.id}`)}>
                    <Avatar look={f.look} size={52} />
                    <span><b>{f.nickname}</b><small>{f.last ? (f.last.kind === 'invite' ? tr('🎲 Lời mời chơi', '🎲 Game invite') : `${f.last.mine ? tr('Bé: ', 'You: ') : ''}${f.last.text}`) : tr('Bấm để trò chuyện', 'Tap to chat')}</small></span>
                    {f.unread > 0 && <i className="badge-n">{f.unread}</i>}
                  </button>
                  <Btn tone="orange" size="sm" disabled={!d.social || !f.social} onClick={() => setPicker(f)}>{tr('Mời chơi', 'Play')}</Btn>
                  <Btn tone="gray" size="sm" onClick={() => setProfile(f.id)}>{tr('Hồ sơ', 'Profile')}</Btn>
                </div>
              ))}
              <div className="panel-actions"><Btn tone="cream" onClick={() => go('ranking')}>🏆 {T.t('ranking')}</Btn></div>
            </Panel>
          </div>
        )}
      </div>
      {profile && <ProfileDialog id={profile} onClose={() => { setProfile(null); void load(); }} />}
      {picker !== undefined && <GamePicker friend={picker ?? undefined} onClose={() => setPicker(undefined)} />}
    </div>
  );
}

const STICKERS = ['👋', '😀', '😂', '😍', '👍', '🎉', '🔥', '⭐', '💪', '🙏', '😢', '🤔'];
const QUICK: [string, string][] = [['Chào bạn!', 'Hi!'], ['Chơi cùng không?', 'Want to play?'], ['Giỏi quá!', 'Great job!'], ['Mai học tiếp nhé!', 'Let’s study tomorrow!']];

export function Chat({ friendId }: { friendId: number }) {
  const T = useT(); const tr: Tr = (vi, en) => (T.lang === 'en' ? en : vi);
  const childId = useApp((s) => s.childId);
  const [friend, setFriend] = useState<FriendCard | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [canChat, setCanChat] = useState(true);
  const [text, setText] = useState('');
  const [err, setErr] = useState(false);
  const [menu, setMenu] = useState<'profile' | 'report' | 'play' | null>(null);
  const last = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const poll = async () => {
    try {
      const r = await api.get<{ friend: FriendCard; canChat: boolean; messages: ChatMsg[] }>(`/children/${childId}/messages/${friendId}?after=${last.current}`);
      setFriend(r.friend); setCanChat(r.canChat);
      if (r.messages.length) { last.current = r.messages[r.messages.length - 1].id; setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]); }
    } catch { setErr(true); }
  };
  useEffect(() => { void poll(); const iv = setInterval(() => { if (document.visibilityState === 'visible') void poll(); }, 3000); return () => { clearInterval(iv); void refreshSocial(); }; }, [friendId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listRef.current?.scrollTo({ top: 1e6 }); }, [msgs.length]);
  const sendText = async (t: string) => {
    const v = t.trim(); if (!v) return;
    try {
      const r = await api.post<{ message: ChatMsg; masked: string[] }>(`/children/${childId}/messages/${friendId}`, { text: v });
      sfx.pop(); setText('');
      last.current = Math.max(last.current, r.message.id); setMsgs((m) => [...m, r.message]);
      if (r.masked.includes('contact') || r.masked.includes('link')) toast(tr('Đã che số điện thoại / đường link để giữ an toàn cho bé.', 'Phone numbers and links are hidden to keep you safe.'), 'warn');
      else if (r.masked.includes('bad')) toast(tr('Mình nói lời hay ý đẹp nhé!', 'Let’s use kind words!'), 'warn');
    } catch (e) { sfx.wrong(); toast(errText(T, e), 'warn'); }
  };
  const fmt = (at: number) => new Date(at).toLocaleTimeString(T.lang === 'en' ? 'en-GB' : 'vi-VN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="screen chat">
      <Scene name="sakura" />
      <div className="screen-content">
        <TopBar title={friend ? `💬 ${friend.nickname}` : '💬'} to="friends" right={friend && <div className="chat-tools"><Btn tone="orange" size="sm" onClick={() => setMenu('play')}>🎲</Btn><Btn tone="cream" size="sm" onClick={() => setMenu('profile')}>👤</Btn><Btn tone="cream" size="sm" onClick={() => setMenu('report')}>🚩</Btn></div>} />
        {err ? <Panel><p>{tr('Không mở được cuộc trò chuyện này.', 'Can’t open this chat.')}</p><Btn tone="gray" onClick={() => go('friends')}>{T.t('back')}</Btn></Panel> : (
          <Panel className="chat-panel">
            <div className="chat-list" ref={listRef} aria-live="polite">
              {!msgs.length && <p className="muted" style={{ textAlign: 'center' }}>{tr('Hãy gửi lời chào tới bạn nhé! Nhớ: không gửi số điện thoại, địa chỉ nhà hay hẹn gặp người lạ.', 'Say hi! Remember: never share your phone number, address, or meet someone you don’t know.')}</p>}
              {msgs.map((m) => (
                <div key={m.id} className={`bubble-row ${m.mine ? 'mine' : ''}`}>
                  {!m.mine && friend && <Avatar look={friend.look} size={34} />}
                  {m.kind === 'invite' && typeof m.body === 'object' ? (
                    <div className="msg invite">
                      <b>{m.mine ? tr('Bé đã mời bạn chơi', 'You invited them to play') : tr('Mời bé chơi', 'Invites you to play')}</b>
                      <span>{gameName(m.body.game, tr)} · {tr('mã phòng', 'room')} {m.body.code}</span>
                      {!m.mine && <Btn tone="orange" size="sm" onClick={() => joinRoomByCode((m.body as { code: string }).code).catch((e) => toast(errText(T, e), 'warn'))}>{tr('Vào phòng', 'Join')}</Btn>}
                    </div>
                  ) : <div className="msg">{String(m.body)}</div>}
                  <small className="msg-time">{fmt(m.at)}</small>
                </div>
              ))}
            </div>
            {canChat ? <>
              <div className="chat-quick">{STICKERS.map((s) => <button key={s} type="button" onClick={() => sendText(s)}>{s}</button>)}{QUICK.map(([vi, en]) => <button key={vi} type="button" className="q" onClick={() => sendText(tr(vi, en))}>{tr(vi, en)}</button>)}</div>
              <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void sendText(text); }}>
                <input className="input" value={text} maxLength={300} placeholder={tr('Nhập tin nhắn…', 'Type a message…')} onChange={(e) => setText(e.target.value)} />
                <Btn tone="lime" type="submit" disabled={!text.trim()}>{tr('Gửi', 'Send')}</Btn>
              </form>
            </> : <p className="shop-note">{tr('Nhắn tin đang tắt (do phụ huynh của bé hoặc của bạn).', 'Chat is turned off by a parent.')}</p>}
          </Panel>
        )}
      </div>
      {menu === 'profile' && friend && <ProfileDialog id={friend.id} onClose={() => setMenu(null)} />}
      {menu === 'report' && friend && <ReportDialog friendId={friend.id} name={friend.nickname} onClose={() => setMenu(null)} onDone={() => go('friends')} />}
      {menu === 'play' && friend && <GamePicker friend={friend} onClose={() => setMenu(null)} />}
    </div>
  );
}

/** Thanh báo lời mời chơi mới (hiện ở mọi màn hình chính). */
const dismissed = new Set<number>();
export function InviteBanner() {
  const T = useT(); const tr: Tr = (vi, en) => (T.lang === 'en' ? en : vi);
  const inv = useApp((s) => s.social?.invite ?? null);
  const [, force] = useState(0);
  if (!inv || dismissed.has(inv.id)) return null;
  const close = () => { dismissed.add(inv.id); force((n) => n + 1); };
  return (
    <div className="invite-banner" role="status">
      <span>🎲 <b>{inv.from}</b> {tr('mời bé chơi', 'invites you to')} {gameName(inv.game, tr)}</span>
      <Btn tone="orange" size="sm" onClick={() => { close(); joinRoomByCode(inv.code).catch((e) => toast(errText(T, e), 'warn')); }}>{tr('Vào phòng', 'Join')}</Btn>
      <Btn tone="gray" size="sm" onClick={close}>{tr('Để sau', 'Later')}</Btn>
    </div>
  );
}
