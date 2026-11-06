import { wordDelayMs } from "./orp";

type ReaderCallbacks = {
  onWord: (index: number, plannedDelayMs: number) => Promise<void> | void;
  onState: () => void;
};

export class ReaderEngine {
  tokens: string[] = [];
  index = 0;
  wpm = 300;
  playing = false;
  private timer: number | null = null;
  private runId = 0;

  constructor(private callbacks: ReaderCallbacks) {}

  load(tokens: string[]): void {
    this.pause();
    this.tokens = tokens;
    this.index = 0;
    this.emitWord();
    this.callbacks.onState();
  }

  toggle(): void {
    this.playing ? this.pause() : this.play();
  }

  play(): void {
    if (this.tokens.length === 0 || this.playing) return;
    this.playing = true;
    this.callbacks.onState();
    this.scheduleNext();
  }

  pause(): void {
    this.playing = false;
    this.runId += 1;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
    this.callbacks.onState();
  }

  restart(): void {
    this.index = 0;
    this.emitWord();
    if (this.playing) this.scheduleNext();
    this.callbacks.onState();
  }

  step(delta: number): void {
    if (this.playing || this.tokens.length === 0) return;
    this.seek(this.index + delta);
  }

  seek(index: number): void {
    if (this.tokens.length === 0) return;
    this.index = Math.min(this.tokens.length - 1, Math.max(0, Math.round(index)));
    this.emitWord();
    if (this.playing) this.scheduleNext();
    this.callbacks.onState();
  }

  setWpm(wpm: number): void {
    this.wpm = Math.min(1000, Math.max(100, wpm));
    if (this.playing) this.scheduleNext();
    this.callbacks.onState();
  }

  private scheduleNext(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;

    const runId = ++this.runId;
    const token = this.tokens[this.index];
    const delayMs = wordDelayMs(token, this.wpm, this.index);
    const wordReady = Promise.resolve(this.emitWord(delayMs));
    const minimumDelayReady = new Promise<void>((resolve) => {
      this.timer = window.setTimeout(resolve, delayMs);
    });

    Promise.all([wordReady, minimumDelayReady]).then(() => {
      if (!this.playing || runId !== this.runId) return;
      if (this.index >= this.tokens.length - 1) {
        this.pause();
        return;
      }
      this.index += 1;
      this.callbacks.onState();
      this.scheduleNext();
    });
  }

  private emitWord(plannedDelayMs = 0): Promise<void> | void {
    if (this.tokens.length > 0) return this.callbacks.onWord(this.index, plannedDelayMs);
  }
}
