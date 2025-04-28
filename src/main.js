const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 用于存储数据的配置
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// 默认配置
const defaultConfig = {
  currentTheme: 0,
  isShowText: true,
  currentText: '功德+1',
  totalNumber: 0,
  isAutoTap: false,
  showCalculateNumber: false,
  alwaysOnTop: true
};

// 定义木鱼主题列表
const themes = [
  { 
    index: 0, 
    name: '木鱼1',
    icon: '../assets/images/muyutou_yellow.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#8B5A2B'
  },
  { 
    index: 1, 
    name: '木鱼2',
    icon: '../assets/images/muyutou_white.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#9370DB'
  },
  { 
    index: 2, 
    name: '木鱼3',
    icon: '../assets/images/muyutou_sliver.png', 
    audio: '../assets/audio/muyu_audio.mp3',
    color: '#DC143C'
  },
  { 
    index: 3, 
    name: '木鱼4',
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
    // 确保配置目录存在
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      console.log(`创建配置目录: ${configDir}`);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    console.log(`保存配置到: ${configPath}`);
    console.log('配置内容:', JSON.stringify(config));
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('配置保存成功');
    return true;
  } catch (error) {
    console.error('保存配置失败:', error);
    return false;
  }
}

let mainWindow;
let tray = null;
let autoTapInterval = null;

// 自动敲击函数
function startAutoTap() {
  if (autoTapInterval) clearInterval(autoTapInterval);
  
  autoTapInterval = setInterval(() => {
    if (mainWindow) {
      mainWindow.webContents.send('auto-tap');
    }
  }, 1000);
}

function stopAutoTap() {
  if (autoTapInterval) {
    clearInterval(autoTapInterval);
    autoTapInterval = null;
  }
}

function createWindow() {
  const config = loadConfig();
  
  mainWindow = new BrowserWindow({
    width: 140,
    height: 140,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/images/muyu_icon.png'),
    resizable: true,
    alwaysOnTop: config.alwaysOnTop,
    frame: false,
    transparent: true,
    hasShadow: false,
    skipTaskbar: false,
    movable: true
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

  // 如果配置了自动敲击，启动它
  if (config.isAutoTap) {
    startAutoTap();
  }
}

function updateTrayMenu() {
  if (!tray) return;
  
  const config = loadConfig();
  const contextMenu = buildTrayMenu(config);
  tray.setContextMenu(contextMenu);
}

function buildTrayMenu(config) {
  return Menu.buildFromTemplate([
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
    { type: 'separator' },
    {
      label: '设置',
      submenu: [
        { 
          label: '置顶显示', 
          type: 'checkbox',
          checked: config.alwaysOnTop,
          click: (menuItem) => {
            config.alwaysOnTop = menuItem.checked;
            saveConfig(config);
            if (mainWindow) {
              mainWindow.setAlwaysOnTop(menuItem.checked);
            }
          } 
        },
        { 
          label: '自动敲击', 
          type: 'checkbox',
          checked: config.isAutoTap,
          click: (menuItem) => {
            config.isAutoTap = menuItem.checked;
            saveConfig(config);
            
            if (menuItem.checked) {
              startAutoTap();
            } else {
              stopAutoTap();
            }
          } 
        },
        { 
          label: '显示功德文字', 
          type: 'checkbox',
          checked: config.isShowText,
          click: (menuItem) => {
            config.isShowText = menuItem.checked;
            saveConfig(config);
            if (mainWindow) {
              mainWindow.webContents.send('update-show-text', menuItem.checked);
            }
          } 
        },
        { 
          label: '显示计数器', 
          type: 'checkbox',
          checked: config.showCalculateNumber,
          click: (menuItem) => {
            config.showCalculateNumber = menuItem.checked;
            saveConfig(config);
            if (mainWindow) {
              mainWindow.webContents.send('update-show-counter', menuItem.checked);
            }
          }
        },
        { type: 'separator' },
        {
          label: '木鱼主题',
          submenu: themes.map((theme, index) => ({
            label: `${theme.name || `主题 ${index + 1}`}`,
            type: 'radio',
            checked: config.currentTheme === index,
            click: () => {
              console.log(`切换主题: ${index}`);

              // 更新配置
              const updatedConfig = loadConfig();
              updatedConfig.currentTheme = index;
              const saved = saveConfig(updatedConfig);

              if (saved) {
                console.log(`主题已保存: ${index}`);

                // 通知渲染进程
                if (mainWindow) {
                  console.log('通知渲染进程切换主题');
                  mainWindow.webContents.send('update-theme', index);
                }
              } else {
                console.error('保存主题失败');
              }
              // 更新托盘菜单
              updateTrayMenu();
            }
          }))
        }
      ]
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
}

function createTray() {
  // 创建托盘图标
  try {
    tray = new Tray(path.join(__dirname, '../assets/images/muyu_icon.png'));
    
    // 设置托盘菜单
    const config = loadConfig();
    const contextMenu = buildTrayMenu(config);

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
  } catch (error) {
    console.error('创建托盘图标失败:', error);
  }
}

app.whenReady().then(() => {
  console.log(`应用数据路径: ${app.getPath('userData')}`);
  console.log(`配置文件路径: ${configPath}`);
  
  // 尝试创建配置目录
  try {
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`创建配置目录成功: ${configDir}`);
    }
  } catch (error) {
    console.error('创建配置目录失败:', error);
  }
  
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
  stopAutoTap();
});

// IPC通信
ipcMain.handle('get-config', () => {
  return loadConfig();
});

ipcMain.handle('save-config', (event, config) => {
  const result = saveConfig(config);
  if (result) {
    updateTrayMenu();
  }
  return result;
});

// 添加处理主题资源路径的函数
function resolveThemeAssetPath(relativePath) {
  try {
    const cleanPath = relativePath.replace(/^\.\.\//, '');
    const absolutePath = path.join(__dirname, '..', cleanPath);
    
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    } else {
      console.warn(`资源文件不存在: ${absolutePath}`);
      return null;
    }
  } catch (error) {
    console.error('解析资源路径失败:', error);
    return null;
  }
}

// 在get-themes处理函数中增加绝对路径信息
ipcMain.handle('get-themes', () => {
  const themesWithAbsolutePaths = themes.map(theme => {
    const result = { ...theme };
    if (theme.icon) {
      result.absoluteIcon = resolveThemeAssetPath(theme.icon) || theme.icon;
    }
    if (theme.audio) {
      result.absoluteAudio = resolveThemeAssetPath(theme.audio) || theme.audio;
    }
    return result;
  });
  return themesWithAbsolutePaths;
});

// 添加置顶和取消置顶的IPC处理
ipcMain.handle('set-always-on-top', (event, value) => {
  const config = loadConfig();
  config.alwaysOnTop = value;
  saveConfig(config);
  
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(value);
  }
  
  updateTrayMenu();
  return true;
});

// 添加最小化窗口的IPC处理
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return true;
});

// 添加隐藏窗口的IPC处理
ipcMain.handle('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  return true;
});

// 添加获取资源文件绝对路径的IPC处理
ipcMain.handle('get-asset-path', (event, relativePath) => {
  // 确保路径正确处理
  const cleanPath = relativePath.replace(/^\.\.\//, '');
  const absolutePath = path.join(__dirname, '..', cleanPath);
  
  // 检查文件是否存在
  if (fs.existsSync(absolutePath)) {
    console.log(`资源文件存在: ${absolutePath}`);
    return absolutePath;
  } else {
    console.error(`资源文件不存在: ${absolutePath}`);
    // 尝试备用路径
    const alternativePaths = [
      path.join(__dirname, cleanPath),
      path.join(app.getAppPath(), cleanPath),
      path.join(process.resourcesPath, cleanPath)
    ];
    
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        console.log(`找到备用资源: ${altPath}`);
        return altPath;
      }
    }
    
    // 都找不到，返回原始路径
    return absolutePath;
  }
}); 