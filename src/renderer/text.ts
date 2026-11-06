export function tokenize(input: string): string[] {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function displayToken(token: string): string {
  return token.trim();
}

export function speechToken(token: string): string {
  return token
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .replace(/[’‘]/g, "'")
    .toLocaleLowerCase("en-US");
}
