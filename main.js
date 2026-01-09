import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

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
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  win.setMenu(null);
  win.setAlwaysOnTop(true, 'screen-saver');

  // Detection of Global Context (Focus/Blur)
  win.on('focus', () => {
    win.webContents.send('app-focus-change', true);
  });

  win.on('blur', () => {
    win.webContents.send('app-focus-change', false);
  });

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

if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});