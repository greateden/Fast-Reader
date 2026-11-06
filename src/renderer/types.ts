export type TextFilePayload = {
  name: string;
  text: string;
};

export type FastReaderApi = {
  openTextFile: () => Promise<TextFilePayload | null>;
  closeWindow: () => Promise<void>;
};

declare global {
  interface Window {
    fastReader: FastReaderApi;
  }
}
