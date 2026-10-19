// Máy chủ giả lập giao thức Hrana v2 (HTTP pipeline) của Turso, chạy trên node:sqlite — chỉ dùng cho test.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

export async function fakeTurso(token) {
  const { DatabaseSync } = await import('node:sqlite');
  const file = ':memory:';
  const shared = new DatabaseSync(file); // một DB dùng chung cho mọi kết nối
  const streams = new Map(); // baton → true (đang có giao dịch)
  let requests = 0;
  const dec = (a) => (a.type === 'null' ? null : a.type === 'integer' ? Number(a.value) : a.type === 'float' ? a.value : a.value);
  const enc = (v) => (v === null || v === undefined ? { type: 'null' } : typeof v === 'number' || typeof v === 'bigint' ? (Number.isInteger(Number(v)) ? { type: 'integer', value: String(v) } : { type: 'float', value: Number(v) }) : { type: 'text', value: String(v) });
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      requests++;
      if (req.url !== '/v2/pipeline' || req.method !== 'POST') { res.writeHead(404); return res.end(); }
      if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401); return res.end('unauthorized'); }
      const { baton, requests: reqs } = JSON.parse(body);
      if (baton && !streams.has(baton)) { res.writeHead(400); return res.end('bad baton'); }
      let closed = false;
      const results = reqs.map((r) => {
        try {
          if (r.type === 'close') { closed = true; return { type: 'ok', response: { type: 'close' } }; }
          if (r.type !== 'execute') throw new Error('unsupported ' + r.type);
          const st = shared.prepare(r.stmt.sql);
          const args = (r.stmt.args ?? []).map(dec);
          let rows = [], cols = [], changes = 0, last = null;
          if (st.columns().length) { const out = st.all(...args); cols = st.columns().map((c) => ({ name: c.name, decltype: null })); rows = out.map((o) => cols.map((c) => enc(o[c.name]))); }
          else { const info = st.run(...args); changes = Number(info.changes); last = String(info.lastInsertRowid); }
          return { type: 'ok', response: { type: 'execute', result: { cols, rows, affected_row_count: changes, last_insert_rowid: last } } };
        } catch (e) { return { type: 'error', error: { message: e.message } }; }
      });
      let next = null;
      if (closed) { if (baton) streams.delete(baton); }
      else { next = baton ?? randomBytes(8).toString('hex'); streams.set(next, true); }
      if (baton && next !== baton) streams.delete(baton);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ baton: next, base_url: null, results }));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, get requests() { return requests; }, openStreams: () => streams.size, close: () => server.close() };
}
