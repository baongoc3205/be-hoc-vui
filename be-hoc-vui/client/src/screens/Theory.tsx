// Góc lý thuyết: bé đọc lại kiến thức (bảng cửu chương, công thức, quy tắc…) theo môn và lớp.
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { go, useApp } from '../lib/store';
import { useT } from '../lib/hooks';
import type { LText, SubjectId } from '../lib/types';
import { Btn, Panel, Spinner, TopBar } from '../ui/kit';
import { Scene } from '../ui/Scene';
import { SkillTile } from '../ui/Icons';
import { sfx } from '../lib/sfx';
import { speak, stopSpeak } from '../lib/speech';
import { NumberLine, OpTable, Periodic, Primes, Squares } from '../ui/TheoryWidgets';

type Cell = string | LText;
type Block =
  | { t: 'p' | 'rule'; text: LText } | { t: 'list'; items: LText[] } | { t: 'f'; items: string[]; note: LText | null }
  | { t: 'table'; head: Cell[]; rows: Cell[][] } | { t: 'ex'; q: LText; a: LText } | { t: 'w'; name: string } | { t: 'nl'; op: string; v: number; label: LText };
export interface TheoryTopic { id: string; subject: SubjectId; from: number; to: number; icon: string; title: LText; intro: LText; blocks: Block[] }

let cache: TheoryTopic[] | null = null;
function useTopics() {
  const [list, setList] = useState<TheoryTopic[] | null>(cache);
  useEffect(() => { if (!cache) api.get<{ topics: TheoryTopic[] }>('/theory').then((r) => { cache = r.topics; setList(r.topics); }).catch(() => setList([])); }, []);
  return list;
}
const gradeLabel = (t: TheoryTopic, tr: (v: string, e: string) => string) => (t.from === t.to ? tr(`Lớp ${t.from}`, `Grade ${t.from}`) : tr(`Lớp ${t.from}–${t.to}`, `Grades ${t.from}–${t.to}`));

export function Theory({ id, query }: { id?: string; query?: string }) {
  const T = useT();
  const tr = (vi: string, en: string) => (T.lang === 'en' ? en : vi);
  const cs = useApp((s) => s.cs)!;
  const catalog = useApp((s) => s.catalog)!;
  const topics = useTopics();
  const q = new URLSearchParams(query ?? '');
  const [subject, setSubject] = useState<string>(q.get('s') ?? 'all');
  const [grade, setGrade] = useState<number | 0>(Number(q.get('g')) || cs.child.grade);
  const topic = topics?.find((t) => t.id === id) ?? null;
  const list = useMemo(() => (topics ?? []).filter((t) => (subject === 'all' || t.subject === subject) && (!grade || (grade >= t.from && grade <= t.to))), [topics, subject, grade]);

  return (
    <div className="screen theory">
      <Scene name="village" />
      <div className="screen-content">
        <TopBar title={topic ? `${topic.icon} ${T.tx(topic.title)}` : `📖 ${T.t('theory')}`} onBack={() => { stopSpeak(); go(topic ? `theory?s=${subject}&g=${grade}` : 'lobby'); }} />
        {!topics ? <Spinner /> : topic ? <Article topic={topic} all={topics} tr={tr} /> : (
          <Panel className="scroll-y th-index" head={<h2>{T.t('theorySub')}</h2>}>
            <div className="chips th-filter">
              <button type="button" className={`chip ${subject === 'all' ? 'on' : ''}`} onClick={() => { sfx.tap(); setSubject('all'); }}>{T.t('allTags')}</button>
              {catalog.subjects.map((s) => <button key={s.id} type="button" className={`chip ${subject === s.id ? 'on' : ''}`} onClick={() => { sfx.tap(); setSubject(s.id); }}>{T.tx(s.name)}</button>)}
            </div>
            <div className="chips th-filter grades">
              <button type="button" className={`chip ${!grade ? 'on' : ''}`} onClick={() => { sfx.tap(); setGrade(0); }}>{tr('Mọi lớp', 'All grades')}</button>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => <button key={g} type="button" className={`chip ${grade === g ? 'on' : ''}`} onClick={() => { sfx.tap(); setGrade(g); }}>{g}</button>)}
            </div>
            {!list.length && <p className="shop-note">{tr('Chưa có bài cho lựa chọn này, thử lớp khác nhé.', 'Nothing here yet — try another grade.')}</p>}
            <div className="th-grid">
              {list.map((t) => (
                <button key={t.id} type="button" className="th-card" onClick={() => { sfx.page(); go(`theory/${t.id}?s=${subject}&g=${grade}`); }}>
                  <span className="th-ico" aria-hidden>{t.icon}</span>
                  <span className="th-text"><b>{T.tx(t.title)}</b><small>{T.tx(t.intro)}</small><i>{T.tx(catalog.subjects.find((s) => s.id === t.subject)?.name)} · {gradeLabel(t, tr)}</i></span>
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

const txt = (c: Cell, lang: 'vi' | 'en') => (typeof c === 'string' ? c : c[lang] ?? c.vi);

function Article({ topic, all, tr }: { topic: TheoryTopic; all: TheoryTopic[]; tr: (v: string, e: string) => string }) {
  const T = useT();
  const lang = T.lang;
  const cs = useApp((s) => s.cs)!;
  const same = all.filter((t) => t.subject === topic.subject);
  const i = same.findIndex((t) => t.id === topic.id);
  const prev = same[i - 1], next = same[i + 1];
  const grade = Math.min(topic.to, Math.max(topic.from, cs.child.grade));
  useEffect(() => () => stopSpeak(), []);
  const readAll = () => {
    const parts: string[] = [T.tx(topic.title), T.tx(topic.intro)];
    for (const b of topic.blocks) {
      if (b.t === 'p' || b.t === 'rule') parts.push(T.tx(b.text));
      if (b.t === 'list') parts.push(...b.items.map((x) => T.tx(x)));
      if (b.t === 'ex') parts.push(T.tx(b.q), T.tx(b.a));
    }
    speak(parts.join('. '), lang, true);
  };
  return (
    <Panel className="scroll-y th-article" head={<>
      <SkillTile kind={topic.subject} size={54} />
      <div className="th-head"><b>{T.tx(topic.title)}</b><small>{gradeLabel(topic, tr)}<span className="th-intro"> · {T.tx(topic.intro)}</span></small></div>
    </>}>
      <div className="th-body">
        {topic.blocks.map((b, k) => {
          switch (b.t) {
            case 'p': return <p key={k}>{T.tx(b.text)}</p>;
            case 'rule': return <div key={k} className="th-rule">💡 {T.tx(b.text)}</div>;
            case 'list': return <ul key={k}>{b.items.map((x, j) => <li key={j}>{T.tx(x)}</li>)}</ul>;
            case 'f': return <div key={k} className="th-f">{b.items.map((x, j) => <code key={j}>{x}</code>)}{b.note && <small>{T.tx(b.note)}</small>}</div>;
            case 'ex': return <details key={k} className="th-ex" open><summary>✏️ {tr('Ví dụ', 'Example')}: {T.tx(b.q)}</summary><p>👉 {T.tx(b.a)}</p></details>;
            case 'table': return (
              <div key={k} className="tw-grid-wrap"><table className="th-table">
                <thead><tr>{b.head.map((h, j) => <th key={j}>{txt(h, lang)}</th>)}</tr></thead>
                <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, m) => <td key={m}>{txt(c, lang)}</td>)}</tr>)}</tbody>
              </table></div>
            );
            case 'nl': return <NumberLine key={k} op={b.op} v={b.v} label={T.tx(b.label)} />;
            case 'w': return b.name === 'times' ? <OpTable key={k} op="x" tr={tr} lang={lang} /> : b.name === 'add' ? <OpTable key={k} op="+" tr={tr} lang={lang} /> : b.name === 'primes' ? <Primes key={k} tr={tr} /> : b.name === 'squares' ? <Squares key={k} tr={tr} /> : b.name === 'periodic' ? <Periodic key={k} tr={tr} lang={lang} /> : null;
            default: return null;
          }
        })}
      </div>
      <div className="panel-actions th-actions">
        <Btn tone="cream" size="sm" onClick={readAll}>🔊 {tr('Đọc cho bé nghe', 'Read aloud')}</Btn>
        {prev && <Btn tone="gray" size="sm" title={T.tx(prev.title)} onClick={() => { stopSpeak(); go(`theory/${prev.id}`); }}>‹ {tr('Bài trước', 'Previous')}</Btn>}
        {next && <Btn tone="gray" size="sm" title={T.tx(next.title)} onClick={() => { stopSpeak(); go(`theory/${next.id}`); }}>{tr('Bài sau', 'Next')} ›</Btn>}
        <Btn tone="lime" size="sm" onClick={() => { stopSpeak(); go(`map/${topic.subject}/${grade}`); }}>{tr('Luyện tập ngay', 'Practise now')}</Btn>
      </div>
    </Panel>
  );
}
