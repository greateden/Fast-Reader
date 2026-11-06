export type OrpParts = {
  prefix: string;
  orp: string;
  suffix: string;
  index: number;
};

function targetCoreIndex(length: number): number {
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

export function getOrpParts(token: string): OrpParts {
  const chars = Array.from(token);
  const alphaPositions: number[] = [];

  chars.forEach((char, index) => {
    if (/^\p{L}$/u.test(char)) alphaPositions.push(index);
  });

  let index = 0;
  if (alphaPositions.length > 0) {
    const coreIndex = Math.min(targetCoreIndex(alphaPositions.length), alphaPositions.length - 1);
    index = alphaPositions[coreIndex];
  } else if (chars.length > 0) {
    index = Math.min(targetCoreIndex(chars.length), chars.length - 1);
  }

  return {
    prefix: chars.slice(0, index).join(""),
    orp: chars[index] ?? "",
    suffix: chars.slice(index + 1).join(""),
    index
  };
}

function coreWord(token: string): string {
  return token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
}

function estimateSyllables(word: string): number {
  const normalized = word.toLocaleLowerCase("en-US").replace(/[^a-z]/g, "");
  if (normalized.length <= 3) return 1;

  const withoutSilentE = normalized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/u, "");
  const vowelGroups = withoutSilentE.match(/[aeiouy]+/g);
  return Math.max(1, vowelGroups?.length ?? 1);
}

function isImportantShortWord(word: string): boolean {
  return /^(?:a|i|am|an|as|at|be|by|do|go|he|if|in|is|it|me|my|no|not|of|on|or|so|to|up|us|we|but|can|did|for|had|has|her|him|his|nor|off|our|out|she|the|was|who|why|you|yet|can't|dont|don't|isn't|won't)$/i.test(
    word
  );
}

function startRamp(index: number): number {
  if (index < 0 || index >= 10) return 1;
  return 1.28 - index * 0.028;
}

export function wordDelayMs(token: string, wpm: number, index = -1): number {
  const base = 60000 / wpm;
  const core = coreWord(token);
  const length = Array.from(core).length;
  const syllables = estimateSyllables(core);

  let complexity = 0.74 + Math.sqrt(Math.max(1, length)) * 0.11;
  complexity += Math.max(0, syllables - 2) * 0.12;

  if (length <= 2) complexity -= 0.16;
  else if (length <= 4) complexity -= 0.07;
  else if (length >= 9) complexity += Math.min(0.42, (length - 8) * 0.045);

  if (isImportantShortWord(core)) complexity = Math.max(complexity, 0.96);
  if (/\d/.test(core)) complexity = Math.max(complexity, 1.35);

  complexity *= startRamp(index);
  complexity = Math.min(2.25, Math.max(0.62, complexity));

  let punctuationDelay = 0;

  if (/[.!?]["')\]]?$/.test(token)) punctuationDelay = base * 0.9;
  else if (/[,;:]["')\]]?$/.test(token)) punctuationDelay = base * 0.45;

  return base * complexity + punctuationDelay;
}
