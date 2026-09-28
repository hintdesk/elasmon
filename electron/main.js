const { app, BrowserWindow, Menu, ipcMain, nativeTheme } = require('electron');
const path = require('path');

// Must match the menubar height (48px min-height minus 1px bottom border) in src/app/app.css
const TITLE_BAR_HEIGHT = 47;
const TITLE_BAR_COLORS = {
  light: { color: '#ffffff', symbolColor: '#3f3f46' },
  dark: { color: '#18181b', symbolColor: '#fafafa' },
};

let mainWindow;

ipcMain.on('set-dark-mode', (event, isDark) => {
  nativeTheme.themeSource = isDark ? 'dark' : 'light';

  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && process.platform !== 'darwin') {
    win.setTitleBarOverlay({
      ...(isDark ? TITLE_BAR_COLORS.dark : TITLE_BAR_COLORS.light),
      height: TITLE_BAR_HEIGHT,
    });
  }
});

function createWindow() {
  // Remove default menu
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, 'icon.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { ...TITLE_BAR_COLORS.light, height: TITLE_BAR_HEIGHT },
    trafficLightPosition: { x: 16, y: 22 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Angular app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // For production, load from the app's resource directory
    const indexPath = path.join(__dirname, '..', 'dist', 'elasmon', 'browser', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
