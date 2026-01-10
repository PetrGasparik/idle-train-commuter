
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let si = null;
let win = null;

function getVirtualDesktopBounds() {
  const displays = screen.getAllDisplays();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  displays.forEach(display => {
    const { x, y, width, height } = display.bounds;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function createWindow() {
  const bounds = getVirtualDesktopBounds();

  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
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

  // Handle monitor changes (plug/unplug)
  const updateLayout = () => {
    const newBounds = getVirtualDesktopBounds();
    if (win) {
      win.setBounds(newBounds);
    }
  };

  screen.on('display-metrics-changed', updateLayout);
  screen.on('display-added', updateLayout);
  screen.on('display-removed', updateLayout);

  // Hardware Polling with Graceful Fallback
  const pollHw = setInterval(async () => {
    if (!win || win.isDestroyed()) {
      clearInterval(pollHw);
      return;
    }

    if (si === null) {
      try {
        const mod = await import('systeminformation');
        si = mod.default || mod;
      } catch (e) {
        return;
      }
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
        temp: temp.main || 45,
        isReal: true
      };
      win.webContents.send('hw-stats-update', stats);
    } catch (e) {}
  }, 2000);

  ipcMain.on('set-ignore-mouse-events', (event, ignore, forward) => {
    if (win) {
      win.setIgnoreMouseEvents(ignore, { forward: forward });
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
