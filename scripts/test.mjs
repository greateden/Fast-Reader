import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

async function loadModule(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", write: false });
  const module = { exports: {} };
  new Function("module", "exports", result.outputFiles[0].text)(module, module.exports);
  return module.exports;
}

const { tokenize, speechToken } = await loadModule("src/renderer/text.ts");
const { getOrpParts, wordDelayMs } = await loadModule("src/renderer/orp.ts");
const { ReaderEngine } = await loadModule("src/renderer/reader.ts");

// A controlled clock checks transitions without opening Electron or playing audio.
function clock() {
  const oldWindow = globalThis.window;
  let nextId = 0;
  const timers = new Map();
  globalThis.window = {
    setTimeout: (callback) => { timers.set(++nextId, callback); return nextId; },
    clearTimeout: (id) => timers.delete(id)
  };
  return {
    async tick() {
      const ready = [...timers.values()];
      timers.clear();
      ready.forEach((callback) => callback());
      await Promise.resolve();
      await Promise.resolve();
    },
    restore() {
      if (oldWindow === undefined) delete globalThis.window;
      else globalThis.window = oldWindow;
    }
  };
}

test("whitespace and punctuation remain predictable", () => {
  assert.deepEqual(tokenize(" \n Hello,\tworld!  "), ["Hello,", "world!"]);
  assert.deepEqual(tokenize(" \n\t"), []);
  assert.equal(speechToken("‘Hello!’"), "hello");
});

test("red-letter selection preserves Unicode and punctuation", () => {
  for (const [token, expected] of [["A", "A"], ["(hello!)", "e"], ["abcdef", "c"], ["abcdefghij", "d"], ["abcdefghijklmn", "e"], ["école", "c"], ["😀a", "a"], ["", ""]]) {
    const parts = getOrpParts(token);
    assert.equal(parts.orp, expected);
    assert.equal(parts.prefix + parts.orp + parts.suffix, token);
  }
});

test("delay responds to speed, punctuation and the starting ramp", () => {
  assert.equal(wordDelayMs("hello", 600), wordDelayMs("hello", 300) / 2);
  assert.ok(wordDelayMs("hello.", 300) > wordDelayMs("hello", 300));
  assert.ok(wordDelayMs("hello", 300, 0) > wordDelayMs("hello", 300, 10));
  assert.ok(Number.isFinite(wordDelayMs("123", 300)));
});

test("play reaches the last word and pauses", async () => {
  const time = clock();
  try {
    const reader = new ReaderEngine({ onWord() {}, onState() {} });
    reader.load(["one", "two"]);
    reader.play();
    await time.tick();
    assert.equal(reader.index, 1);
    await time.tick();
    assert.equal(reader.playing, false);
    assert.equal(reader.index, 1);
  } finally { time.restore(); }
});

test("pause invalidates a pending word callback", async () => {
  const time = clock();
  try {
    let finishWord;
    const reader = new ReaderEngine({ onWord: () => new Promise((resolve) => { finishWord = resolve; }), onState() {} });
    reader.load(["one", "two"]);
    reader.play();
    await time.tick();
    reader.pause();
    finishWord();
    await time.tick();
    assert.equal(reader.index, 0);
    assert.equal(reader.playing, false);
  } finally { time.restore(); }
});

test("loading new text invalidates old playback; seeking stays in bounds", async () => {
  const time = clock();
  try {
    const reader = new ReaderEngine({ onWord() {}, onState() {} });
    reader.load(["old", "text"]);
    reader.play();
    reader.load(["new"]);
    await time.tick();
    assert.equal(reader.index, 0);
    assert.equal(reader.playing, false);
    reader.seek(100);
    assert.equal(reader.index, 0);
    reader.seek(-1);
    assert.equal(reader.index, 0);
    reader.load([]);
    reader.play();
    assert.equal(reader.playing, false);
  } finally { time.restore(); }
});
