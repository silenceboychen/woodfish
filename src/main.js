const { app, BrowserWindow, ipcMain } = require('electron');
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
  quickChangeAudio: true
};

// 定义木鱼主题列表
const themes = [
  { 
    index: 0, 
    name: '传统木鱼', 
    icon: '../assets/images/muyu_icon.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#8B5A2B'
  },
  { 
    index: 1, 
    name: '铃铛', 
    icon: '../assets/images/graphic_bell_icon.png', 
    audio: '../assets/audio/bells_audio.mp3',
    color: '#9370DB'
  },
  { 
    index: 2, 
    name: 'BOOM', 
    icon: '../assets/images/boom_icon.png', 
    audio: '../assets/audio/boom_audio.mp3',
    color: '#DC143C'
  },
  { 
    index: 3, 
    name: '放屁', 
    icon: '../assets/images/fangpi_icon.png', 
    audio: '../assets/audio/fangpi_audio.mp3',
    color: '#556B2F'
  },
  { 
    index: 4, 
    name: '闪电', 
    icon: '../assets/images/lightning.png', 
    audio: '../assets/audio/lighting_audio.mp3',
    color: '#4169E1'
  },
  { 
    index: 5, 
    name: 'OH', 
    icon: '../assets/images/oh_icon.png', 
    audio: '../assets/audio/oh_audio.mp3',
    color: '#FF8C00'
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/images/muyu_icon.png'),
    resizable: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  // 在开发环境中打开开发者工具
  // mainWindow.webContents.openDevTools();
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