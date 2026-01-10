
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';

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

  // Hardware Polling
  const pollHw = setInterval(async () => {
    if (win.isDestroyed()) {
      clearInterval(pollHw);
      return;
    }
    try {
      const [load, mem, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.cpuTemperature()
      ]);

      const stats = {
        cpu: load.currentLoad,
        ram: (mem.active / mem.total) * 100,
        temp: temp.main || 45, // Fallback if temp sensor not found
        isReal: true
      };
      win.webContents.send('hw-stats-update', stats);
    } catch (e) {
      // Quietly fail if si has issues
    }
  }, 2000);

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
