import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#050505",
    title: "FastReader",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../../src/renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("open-text-file", async () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;
  if (!window) return null;

  const result = await dialog.showOpenDialog(window, {
    title: "Open text file",
    properties: ["openFile"],
    filters: [{ name: "Text files", extensions: ["txt", "text", "md"] }]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const text = await fs.readFile(filePath, "utf8");
  return { name: path.basename(filePath), text };
});

ipcMain.handle("close-window", () => {
  const window = BrowserWindow.getFocusedWindow() ?? mainWindow;
  window?.close();
});
