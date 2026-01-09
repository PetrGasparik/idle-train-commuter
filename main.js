
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds; // Použijeme celou plochu včetně taskbaru pro perimeter

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
    movable: false,
    focusable: true,
    backgroundColor: '#00000000', // Explicitní průhlednost pro Windows
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Na Windows je setIgnoreMouseEvents klíčový pro "průchodnost" kliknutí
  win.setIgnoreMouseEvents(true, { forward: true });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // V buildu musíme zajistit správnou cestu k index.html
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  // Windows optimalizace: vypnutí menu a zajištění, že okno je vždy nahoře
  win.setMenu(null);
  win.setAlwaysOnTop(true, 'screen-saver');

  ipcMain.on('set-ignore-mouse-events', (event, ignore, forward) => {
    const targetWin = BrowserWindow.fromWebContents(event.sender);
    if (targetWin) {
      targetWin.setIgnoreMouseEvents(ignore, { forward: forward });
    }
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });
}

// Kritické pro Windows průhlednost
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

// Hardwarová akcelerace může na některých GPU způsobovat černé pozadí místo průhledného
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  // Krátká prodleva pomáhá OS správně inicializovat průhlednost okna
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
