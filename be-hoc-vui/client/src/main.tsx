import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Gửi lỗi trình duyệt về máy chủ (không kèm tên hay email), tối đa 5 lỗi mỗi lần mở trang.
let sentErrors = 0;
const report = (message: string, stack?: string) => {
  if (sentErrors >= 5 || !message) return; sentErrors++;
  fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.slice(0, 500), stack: (stack ?? '').slice(0, 3000), route: location.hash.slice(0, 200) }), keepalive: true }).catch(() => undefined);
};
addEventListener('error', (e) => report(String(e.message ?? e.error), e.error?.stack));
addEventListener('unhandledrejection', (e) => { const r = e.reason as { message?: string; stack?: string; code?: string } | undefined; if (r?.code) return; report(String(r?.message ?? r), r?.stack); });

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
}
