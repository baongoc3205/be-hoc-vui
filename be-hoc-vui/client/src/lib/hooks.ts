import { useMemo } from 'react';
import { useApp } from './store';
import { makeT } from './i18n';

export const useT = () => { const lang = useApp((s) => s.prefs.lang); return useMemo(() => makeT(lang), [lang]); };
export const openSettings = () => dispatchEvent(new Event('bhv:settings'));
