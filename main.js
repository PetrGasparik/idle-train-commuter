
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

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

  // V produkci načítáme z 'dist/index.html', při vývoji (pokud bys chtěl) z lokálního serveru
  const isDev = !app.isPackaged;
  if (isDev) {
    // V devu bys mohl použít win.loadURL('http://localhost:5173')
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

app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
