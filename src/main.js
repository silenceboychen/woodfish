const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 用于存储数据的配置
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// 默认配置
const defaultConfig = {
  currentTheme: 0,
  isShowText: false,
  currentText: '功德+1',
  totalNumber: 0,
  isAutoTap: false,
  showCalculateNumber: true,
  quickChangeAudio: true,
  alwaysOnTop: true
};

// 定义木鱼主题列表
const themes = [
  { 
    index: 0, 
    name: '传统木鱼', 
    icon: '../assets/images/muyutou_yellow.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#8B5A2B'
  },
  { 
    index: 1, 
    name: '传统木鱼', 
    icon: '../assets/images/muyutou_white.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#9370DB'
  },
  { 
    index: 2, 
    name: '传统木鱼', 
    icon: '../assets/images/muyutou_sliver.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#DC143C'
  },
  { 
    index: 3, 
    name: '传统木鱼', 
    icon: '../assets/images/muyutou_red.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#556B2F'
  }
];

// 读取配置
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    return defaultConfig;
  } catch (error) {
    console.error('加载配置失败:', error);
    return defaultConfig;
  }
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

let mainWindow;
let tray = null;

function createWindow() {
  const config = loadConfig();
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/images/muyu_icon.png'),
    resizable: true,
    alwaysOnTop: config.alwaysOnTop,
    frame: true,
    transparent: false,
    hasShadow: true,
    skipTaskbar: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // 在开发环境中打开开发者工具
  // mainWindow.webContents.openDevTools();
  
  // 创建托盘图标
  createTray();
  
  // 窗口关闭事件处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // 当窗口关闭时，隐藏而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });
}

function createTray() {
  // 创建托盘图标
  tray = new Tray(path.join(__dirname, '../assets/images/muyu_icon.png'));
  
  // 设置托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: '显示木鱼', 
      click: () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          mainWindow.show();
        }
      } 
    },
    { 
      label: '置顶显示', 
      type: 'checkbox',
      checked: loadConfig().alwaysOnTop,
      click: (menuItem) => {
        const config = loadConfig();
        config.alwaysOnTop = menuItem.checked;
        saveConfig(config);
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
        }
      } 
    },
    { type: 'separator' },
    { 
      label: '退出', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('木鱼');
  tray.setContextMenu(contextMenu);
  
  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 应用退出前
app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC通信
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  saveConfig(config);
  return true;
});

ipcMain.handle('get-themes', () => {
  return themes;
});

// 添加置顶和取消置顶的IPC处理
ipcMain.handle('set-always-on-top', (event, value) => {
  const config = loadConfig();
  config.alwaysOnTop = value;
  saveConfig(config);
  
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(value);
  }
  
  return true;
}); 