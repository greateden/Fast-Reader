import "./types";
import { getOrpParts } from "./orp";
import { ReaderEngine } from "./reader";
import { SpeechEngine } from "./speech";
import { displayToken, tokenize } from "./text";

const prefixEl = document.querySelector<HTMLSpanElement>("#prefix")!;
const orpEl = document.querySelector<HTMLSpanElement>("#orp")!;
const suffixEl = document.querySelector<HTMLSpanElement>("#suffix")!;
const wordEl = document.querySelector<HTMLDivElement>("#word")!;
const playButton = document.querySelector<HTMLButtonElement>("#playButton")!;
const openButton = document.querySelector<HTMLButtonElement>("#openButton")!;
const speechButton = document.querySelector<HTMLButtonElement>("#speechButton")!;
const voiceSelect = document.querySelector<HTMLSelectElement>("#voiceSelect")!;
const wpmInput = document.querySelector<HTMLInputElement>("#wpmInput")!;
const zoomInput = document.querySelector<HTMLInputElement>("#zoomInput")!;
const zoomOutButton = document.querySelector<HTMLButtonElement>("#zoomOutButton")!;
const zoomInButton = document.querySelector<HTMLButtonElement>("#zoomInButton")!;
const progressInput = document.querySelector<HTMLInputElement>("#progressInput")!;
const textInput = document.querySelector<HTMLTextAreaElement>("#textInput")!;
const setupPanel = document.querySelector<HTMLElement>("#setupPanel")!;
const statusEl = document.querySelector<HTMLDivElement>("#status")!;

let sourceName = "Pasted text";
let spaceHeld = false;
let readerZoom = 100;
const speech = new SpeechEngine(renderVoiceOptions);

let reader: ReaderEngine;
reader = new ReaderEngine({
  onWord: (index, plannedDelayMs): Promise<void> => {
    renderWord(reader.tokens[index] ?? "");
    return speech.speak(reader.tokens[index] ?? "", reader.wpm, plannedDelayMs);
  },
  onState: renderState
});

function ensureLoadedFromPaste(): boolean {
  if (reader.tokens.length > 0) return true;

  const tokens = tokenize(textInput.value);
  if (tokens.length === 0) {
    statusEl.textContent = "Open a text file or paste text to begin";
    return false;
  }

  sourceName = "Pasted text";
  reader.load(tokens);
  return true;
}

function renderWord(rawToken: string): void {
  const token = displayToken(rawToken);
  const parts = getOrpParts(token);

  prefixEl.textContent = parts.prefix;
  orpEl.textContent = parts.orp;
  suffixEl.textContent = parts.suffix;

  alignWordToMarker();
}

function alignWordToMarker(): void {
  wordEl.style.left = "0px";

  const stageRect = wordEl.parentElement!.getBoundingClientRect();
  const wordRect = wordEl.getBoundingClientRect();
  const orpRect = orpEl.getBoundingClientRect();
  const orpCenterInsideWord = orpRect.left + orpRect.width / 2 - wordRect.left;
  const stageCenter = stageRect.width / 2;

  // ORP alignment: use the actually rendered red span as the anchor, then
  // place that anchor on the fixed center marker. This avoids drift from
  // font loading, browser text metrics, kerning, and punctuation.
  wordEl.style.left = `${stageCenter - orpCenterInsideWord}px`;
}

function renderState(): void {
  const total = reader.tokens.length;
  const current = total === 0 ? 0 : reader.index + 1;
  const progress = total === 0 ? 0 : Math.round((current / total) * 100);

  playButton.textContent = reader.playing ? "Pause" : total > 0 && reader.index > 0 ? "Resume" : "Let's Go!";
  wpmInput.value = String(reader.wpm);
  zoomInput.value = String(readerZoom);
  progressInput.max = String(Math.max(0, total - 1));
  progressInput.value = String(total === 0 ? 0 : reader.index);
  progressInput.disabled = total === 0;
  setupPanel.classList.toggle("hidden", reader.playing);
  statusEl.textContent =
    total === 0
      ? "No text loaded"
      : `${sourceName} · ${reader.wpm} WPM · ${current}/${total} · ${progress}%`;
  speechButton.textContent = speech.enabled ? "Speech On" : "Speech Off";
  speechButton.setAttribute("aria-pressed", String(speech.enabled));
}

function renderVoiceOptions(): void {
  const voices = speech.getVoiceOptions();
  voiceSelect.innerHTML = "";

  if (voices.length === 0) {
    const option = new Option("System voice", "");
    voiceSelect.add(option);
    voiceSelect.disabled = true;
    return;
  }

  voiceSelect.disabled = false;
  voices.forEach((voice) => {
    const option = new Option(`${voice.name} (${voice.lang})`, voice.name);
    voiceSelect.add(option);
  });
  voiceSelect.value = speech.getSelectedVoiceName();
}

async function openTextFile(): Promise<void> {
  const file = await window.fastReader.openTextFile();
  if (!file) return;

  const tokens = tokenize(file.text);
  if (tokens.length === 0) {
    statusEl.textContent = `${file.name} contains no readable text`;
    return;
  }

  sourceName = file.name;
  textInput.value = file.text;
  reader.load(tokens);
}

async function enterFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => undefined);
  }
}

playButton.addEventListener("click", async () => {
  if (!ensureLoadedFromPaste()) return;
  await enterFullscreen();
  reader.toggle();
});

openButton.addEventListener("click", openTextFile);

speechButton.addEventListener("click", () => {
  speech.enabled = !speech.enabled;
  if (!speech.enabled) speech.stop();
  renderState();
});

voiceSelect.addEventListener("change", () => {
  speech.setVoice(voiceSelect.value);
  if (reader.playing) reader.seek(reader.index);
});

wpmInput.addEventListener("change", () => {
  reader.setWpm(Number(wpmInput.value) || 300);
});

function setReaderZoom(nextZoom: number): void {
  readerZoom = Math.min(150, Math.max(70, Math.round(nextZoom / 5) * 5));
  document.documentElement.style.setProperty("--reader-zoom", String(readerZoom / 100));
  zoomInput.value = String(readerZoom);
  alignWordToMarker();
}

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLButtonElement
  );
}

zoomInput.addEventListener("input", () => {
  setReaderZoom(Number(zoomInput.value) || 100);
});

zoomOutButton.addEventListener("click", () => {
  setReaderZoom(readerZoom - 5);
});

zoomInButton.addEventListener("click", () => {
  setReaderZoom(readerZoom + 5);
});

progressInput.addEventListener("input", () => {
  if (!ensureLoadedFromPaste()) return;
  reader.seek(Number(progressInput.value) || 0);
});

textInput.addEventListener("input", () => {
  if (reader.playing) return;
  const tokens = tokenize(textInput.value);
  if (tokens.length > 0) {
    sourceName = "Pasted text";
    reader.load(tokens);
  }
});

window.addEventListener("keydown", async (event) => {
  const key = event.key.toLowerCase();
  const commandOrControl = event.metaKey || event.ctrlKey;

  if (isFormControl(event.target) && !commandOrControl) return;

  if (key === " " || event.code === "Space") {
    event.preventDefault();
    if (event.repeat || spaceHeld) return;
    spaceHeld = true;
    if (ensureLoadedFromPaste()) {
      await enterFullscreen();
      reader.play();
    }
  } else if (key === "o" && (!event.shiftKey || commandOrControl)) {
    event.preventDefault();
    await openTextFile();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    reader.setWpm(reader.wpm + 25);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    reader.setWpm(reader.wpm - 25);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    reader.step(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    reader.step(1);
  } else if (key === "s") {
    event.preventDefault();
    speech.enabled = !speech.enabled;
    if (!speech.enabled) speech.stop();
    renderState();
  } else if (key === "r") {
    event.preventDefault();
    reader.restart();
  } else if (event.key === "Escape") {
    event.preventDefault();
    if (document.fullscreenElement) await document.exitFullscreen();
    else await window.fastReader.closeWindow();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    spaceHeld = false;
    reader.pause();
    speech.stop();
  }
});

window.addEventListener("resize", alignWordToMarker);
document.fonts?.ready.then(alignWordToMarker).catch(() => undefined);

speech.refreshVoices();
renderVoiceOptions();
setReaderZoom(readerZoom);
renderWord("FastReader");
renderState();
