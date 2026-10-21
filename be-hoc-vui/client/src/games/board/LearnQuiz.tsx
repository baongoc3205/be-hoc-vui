// Câu hỏi học tập chen vào trò chơi giải trí: lấy sẵn một loạt câu đúng lớp, hỏi khi cần, trả về đúng/sai.
import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useApp } from '../../lib/store';
import type { LText } from '../../lib/types';
import { sfx } from '../../lib/sfx';
import { speak } from '../../lib/speech';
import type { Tr } from './common';

export interface LQuestion { id: string; prompt: LText; title: LText | null; options: LText[]; answer: number; subject: string }
/** Hỏi một câu; trả về true nếu bé trả lời đúng. null = đang tắt học kết hợp. */
export type Ask = ((reason: string) => Promise<boolean>) | null;

export function useQuestions(subject: string, enabled: boolean) {
  const childId = useApp((s) => s.childId);
  const queue = useRef<LQuestion[]>([]);
  const loading = useRef(false);
  const refill = () => {
    if (!enabled || loading.current || queue.current.length > 6) return;
    loading.current = true;
    api.get<{ questions: LQuestion[] }>(`/children/${childId}/questions?n=24${subject && subject !== 'any' ? `&subject=${subject}` : ''}`)
      .then((r) => { queue.current.push(...r.questions); }).catch(() => undefined).finally(() => { loading.current = false; });
  };
  useEffect(() => { queue.current = []; refill(); }, [subject, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return { next: () => { const q = queue.current.shift() ?? null; refill(); return q; } };
}

export function QuizPrompt({ q, reason, tr, lang, onDone }: { q: LQuestion; reason: string; tr: Tr; lang: 'vi' | 'en'; onDone: (ok: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const tx = (x: LText | null | undefined) => (x ? x[lang] ?? x.vi : '');
  useEffect(() => { speak(tx(q.prompt), lang); }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    const ok = i === q.answer;
    if (ok) sfx.correct(); else sfx.wrong();
    setTimeout(() => onDone(ok), ok ? 700 : 1600);
  };
  return (
    <div className="bg-overlay" role="dialog" aria-label={reason}>
      <div className="bg-sheet lq-sheet">
        <span className="lq-reason">🧠 {reason}</span>
        {q.title && <small className="muted">{tx(q.title)}</small>}
        <b className="lq-prompt">{tx(q.prompt)}</b>
        <div className="lq-opts">{q.options.map((o, i) => (
          <button key={i} type="button" disabled={pick !== null} className={`lq-opt ${pick !== null && i === q.answer ? 'right' : ''} ${pick === i && i !== q.answer ? 'wrong' : ''}`} onClick={() => choose(i)}>
            <span>{'ABCD'[i]}</span>{tx(o)}
          </button>
        ))}</div>
        {pick !== null && <p className={`duel-last ${pick === q.answer ? 'ok' : 'no'}`}>{pick === q.answer ? tr('Chính xác!', 'Correct!') : tr(`Chưa đúng — đáp án là ${'ABCD'[q.answer]}.`, `Not quite — the answer is ${'ABCD'[q.answer]}.`)}</p>}
      </div>
    </div>
  );
}
