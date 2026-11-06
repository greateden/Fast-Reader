import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fastReader", {
  openTextFile: () => ipcRenderer.invoke("open-text-file"),
  closeWindow: () => ipcRenderer.invoke("close-window")
});
