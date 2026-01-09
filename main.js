
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// V ES modulech neexistuje globální proměnná __dirname, musíme ji vytvořit takto:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  const isDev = !app.isPackaged;
  if (isDev) {
    // Pokud spouštíte 'npm run dev', Vite běží na portu 5173
    // Pro jednoduchost teď načítáme přímo soubor, ale pro vývoj je lepší URL
    win.loadFile('index.html'); 
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  win.setMenu(null);

  ipcMain.on('set-ignore-mouse-events', (event, ignore, forward) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(ignore, { forward: forward });
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });
}

// Oprava pro průhlednost na některých systémech
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  // Krátká pauza pomáhá stabilitě průhledného okna na Windows
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
