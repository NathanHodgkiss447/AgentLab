export function supportsDemoAudio(): boolean {
  return typeof window !== "undefined" && typeof window.Audio === "function";
}

interface AudioCallbacks {
  onStart: () => void;
  onComplete: () => void;
  onError: () => void;
}
export interface DemoAudioPlayer {
  play: (src: string, speed: number, callbacks: AudioCallbacks) => () => void;
  dispose: () => void;
}

/** Reuse one unlocked media element for every turn in a conversation. */
export function createDemoAudioPlayer(): DemoAudioPlayer {
  const audio = new Audio();
  audio.preload = "auto";
  audio.preservesPitch = true;
  let cancelCurrent: (() => void) | null = null;
  const release = () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };

  return {
    play(src, speed, callbacks) {
      cancelCurrent?.();
      let active = true;
      let watchdog: ReturnType<typeof setTimeout>;
      const detach = () => {
        audio.onplaying = null;
        audio.onended = null;
        audio.onerror = null;
        audio.onloadedmetadata = null;
        clearTimeout(watchdog);
      };
      const settle = (failed: boolean) => {
        if (!active) return;
        active = false;
        detach();
        cancelCurrent = null;
        if (failed) {
          release();
          callbacks.onError();
        } else callbacks.onComplete();
      };
      const armTimeout = (milliseconds: number) => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => settle(true), milliseconds);
      };
      audio.src = src;
      audio.defaultPlaybackRate = Math.min(4, Math.max(0.5, speed));
      audio.playbackRate = audio.defaultPlaybackRate;
      audio.onplaying = () => {
        if (active) callbacks.onStart();
      };
      audio.onended = () => settle(false);
      audio.onerror = () => settle(true);
      audio.onloadedmetadata = () => {
        if (active && Number.isFinite(audio.duration) && audio.duration > 0)
          armTimeout(
            Math.min(120000, Math.max(15000, (audio.duration * 1000) / audio.playbackRate + 10000)),
          );
      };
      armTimeout(15000);
      const cancel = () => {
        if (!active) return;
        active = false;
        detach();
        cancelCurrent = null;
        release();
      };
      cancelCurrent = cancel;
      try {
        audio.play()?.catch(() => settle(true));
      } catch {
        settle(true);
      }
      return cancel;
    },
    dispose() {
      cancelCurrent?.();
      cancelCurrent = null;
      release();
    },
  };
}
