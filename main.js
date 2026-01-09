
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

  // Tato funkce umožní klikat skrz okno na plochu pod ním
  // Druhý parametr 'forward' zajistí, že události pohybu myši stále chodí do aplikace
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile('index.html');
  win.setMenu(null);

  // Přepínání ignorování myši (voláno z Reactu)
  ipcMain.on('set-ignore-mouse-events', (event, ignore, forward) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.setIgnoreMouseEvents(ignore, { forward: forward });
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });
}

// Nutné pro průhlednost na některých systémech
app.commandLine.appendSwitch('enable-transparent-visuals');
app.disableHardwareAcceleration(); // Někdy pomáhá s artefakty u průhlednosti

app.whenReady().then(() => {
  // Počkáme chvíli, než se systém inicializuje
  setTimeout(createWindow, 500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
