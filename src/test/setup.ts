import '@testing-library/jest-dom';

// Mock Web Audio API for tests
class AudioContextMock {
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      type: 'sine',
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
  createBiquadFilter() {
    return {
      connect: () => {},
      frequency: { setValueAtTime: () => {} },
      type: 'lowpass',
    };
  }
  get destination() {
    return {};
  }
  get currentTime() {
    return 0;
  }
  resume() {
    return Promise.resolve();
  }
}

// @ts-expect-error Mock AudioContext
window.AudioContext = AudioContextMock;
// @ts-expect-error Mock webkitAudioContext
window.webkitAudioContext = AudioContextMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
