import { speechToken } from "./text";

export class SpeechEngine {
  enabled = false;
  private voice: SpeechSynthesisVoice | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onVoicesChanged: (() => void) | null = null;
  private finishCurrent: (() => void) | null = null;

  constructor(onVoicesChanged?: () => void) {
    this.onVoicesChanged = onVoicesChanged ?? null;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.refreshVoices();
        this.onVoicesChanged?.();
      });
      this.refreshVoices();
    }
  }

  getVoiceOptions(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getSelectedVoiceName(): string {
    return this.voice?.name ?? "";
  }

  setVoice(name: string): void {
    this.stop();
    this.refreshVoices();
    this.voice = this.voices.find((voice) => voice.name === name) ?? this.voice;
    this.resetSynthesis();
  }

  refreshVoices(): void {
    if ("speechSynthesis" in window) {
      this.voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en"));
      this.pickVoice();
    }
  }

  speak(token: string, wpm: number, plannedDelayMs: number): Promise<void> {
    if (!this.enabled || !("speechSynthesis" in window)) return Promise.resolve();

    const text = speechToken(token);
    if (!text) return Promise.resolve();

    this.finishCurrent?.();
    window.speechSynthesis.cancel();
    this.resetSynthesis();

    return new Promise((resolve) => {
      let resolved = false;
      const visualDeadlineMs = plannedDelayMs > 0 ? Math.max(55, plannedDelayMs * 0.96) : 350 + text.length * 80;
      const visualDeadlineTimer = window.setTimeout(() => finish(), visualDeadlineMs);
      const finish = () => {
        if (resolved) return;
        resolved = true;
        window.clearTimeout(visualDeadlineTimer);
        if (this.finishCurrent === finish) this.finishCurrent = null;
        resolve();
      };

      this.finishCurrent = finish;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.voice?.lang ?? "en-US";
      utterance.rate = this.rateFor(text, wpm, plannedDelayMs);
      utterance.pitch = 0.96;
      utterance.volume = 0.92;
      utterance.onend = finish;
      utterance.onerror = finish;
      if (this.voice) utterance.voice = this.voice;
      window.setTimeout(() => {
        if (resolved) return;
        this.resetSynthesis();
        window.speechSynthesis.speak(utterance);
      }, 0);
    });
  }

  stop(): void {
    this.finishCurrent?.();
    this.finishCurrent = null;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.resetSynthesis();
    }
  }

  private resetSynthesis(): void {
    if ("speechSynthesis" in window) window.speechSynthesis.resume();
  }

  private rateFor(text: string, wpm: number, plannedDelayMs: number): number {
    const wpmRate = Math.pow(wpm / 300, 1.28);
    const estimatedNaturalMs = 300 + text.length * 62;
    const targetMs = plannedDelayMs > 0 ? Math.max(70, plannedDelayMs * 0.74) : estimatedNaturalMs;
    const fitRate = estimatedNaturalMs / targetMs;
    return Math.min(8.5, Math.max(0.85, wpmRate, fitRate));
  }

  private pickVoice(): void {
    if (this.voice && this.voices.some((voice) => voice.name === this.voice?.name)) return;

    const preferredNames = [
      "Samantha",
      "Karen",
      "Moira",
      "Tessa",
      "Daniel",
      "Alex",
      "Microsoft Aria",
      "Microsoft Jenny",
      "Microsoft Guy",
      "Google US English",
      "Google UK English"
    ];

    const byPreferredName = preferredNames
      .map((name) => this.voices.find((voice) => voice.name.includes(name)))
      .find(Boolean);

    this.voice =
      byPreferredName ??
      this.voices.find((voice) => voice.lang === "en-US" && voice.localService) ??
      this.voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && voice.localService) ??
      this.voices[0] ??
      null;
  }
}
