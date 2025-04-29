const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');

// 用于存储数据的配置
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// 默认配置
const defaultConfig = {
  currentTheme: 0,
  isShowText: true,
  currentText: '功德+1',
  totalNumber: 0,
  isAutoTap: true,
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
let settingsWindow = null;
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

  // 创建窗口配置
  const windowOptions = {
    width: 140,
    height: 140,
    webPreferences: {
      // 禁用Node.js集成以提高安全性
      nodeIntegration: false,
      // 启用上下文隔离以防止渲染器进程访问主进程的API
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // 设置窗口不可调整大小
    resizable: false,
    alwaysOnTop: config.alwaysOnTop,
    // 设置窗口无边框
    frame: false,
    // 设置窗口透明
    transparent: true,
    // 设置窗口无阴影
    hasShadow: false,
    // 设置窗口不显示在任务栏
    skipTaskbar: false,
    // 设置窗口可移动
    movable: true
  };

  // 非macOS平台设置窗口图标
  if (process.platform !== 'darwin') {
    const iconPath = path.join(__dirname, '../assets/images/muyu_icon_512.png');
    if (fs.existsSync(iconPath)) {
      windowOptions.icon = nativeImage.createFromPath(iconPath);
      console.log('设置窗口图标:', iconPath);
    } else {
      console.error('窗口图标文件不存在:', iconPath);
    }
  }
  
  // 创建主窗口
  mainWindow = new BrowserWindow(windowOptions);

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

// 创建设置窗口
function createSettingsWindow() {
  // 如果设置窗口已经存在，则只需显示它
  if (settingsWindow) {
    settingsWindow.show();
    return;
  }
  
  // 创建设置窗口配置
  const settingsWindowOptions = {
    width: 500,
    height: 550,
    title: '木鱼设置',
    resizable: false,
    frame: false,
    movable: true,
    skipTaskbar: false,
    minimizable: false,
    maximizable: false,
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  };
  
  // 非macOS平台设置窗口图标
  if (process.platform !== 'darwin') {
    const iconPath = path.join(__dirname, '../assets/images/muyu_icon_512.png');
    if (fs.existsSync(iconPath)) {
      settingsWindowOptions.icon = nativeImage.createFromPath(iconPath);
      console.log('设置窗口图标:', iconPath);
    }
  }
  
  // 创建新的设置窗口
  settingsWindow = new BrowserWindow(settingsWindowOptions);
  
  // 加载设置页面
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  
  // 窗口准备好时显示
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });
  
  // 可以在开发环境中打开开发者工具
  // settingsWindow.webContents.openDevTools();
  
  // 窗口关闭时释放引用
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
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
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: '开源地址',
      click: () => {
        shell.openExternal('https://github.com/silenceboychen/woodfish');
      }
    },
    {
      label: `版本: ${packageJson.version}`,
      enabled: false
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
  // 防止重复创建
  if (tray !== null) {
    return;
  }
  try {
    // 加载图标
    let iconPath = path.join(__dirname, '../assets/images/muyu_icon.png');
    
    // 确保图标文件存在
    if (!fs.existsSync(iconPath)) {
      console.error('托盘图标文件不存在:', iconPath);
      // 尝试备用图标
      iconPath = path.join(__dirname, '../assets/images/muyutou_yellow.png');
      if (!fs.existsSync(iconPath)) {
        console.error('备用图标也不存在');
        return;
      }
    }
    
    // 为macOS创建适当的图标
    let icon;
    if (process.platform === 'darwin') {
      // macOS上使用模板图标，自动适应深色/浅色模式
      icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      icon.setTemplateImage(true); // 设置为模板图标
    } else {
      icon = nativeImage.createFromPath(iconPath);
    }
    
    // 创建托盘
    tray = new Tray(icon);
    tray.setToolTip('木鱼应用');
    
    // 创建托盘菜单
    updateTrayMenu();
    
    // 单击托盘图标显示/隐藏主窗口
    tray.on('click', () => {
      if (mainWindow === null) {
        createWindow();
      } else {
        // if (mainWindow.isVisible()) {
        //   mainWindow.hide();
        // } else {
        //   mainWindow.show();
        // }
      }
    });
    
    // 添加托盘销毁事件处理
    tray.on('destroy', () => {
      console.log('托盘被销毁，尝试重新创建');
      tray = null; // 确保引用清空
      setTimeout(createTray, 1000); // 延迟1秒重建托盘
    });
    
    console.log('托盘创建成功');
  } catch (error) {
    console.error('创建托盘失败:', error);
    // 错误后延迟尝试重建
    setTimeout(() => {
      tray = null;
      createTray();
    }, 3000);
  }
}

// 解析相对路径到绝对路径
function resolveThemeAssetPath(relativePath) {
  return path.resolve(__dirname, relativePath);
}

// 处理主题相对路径转绝对路径
function processThemesWithAbsolutePaths() {
  themes.forEach(theme => {
    if (theme.icon) {
      theme.absoluteIcon = resolveThemeAssetPath(theme.icon);
    }
    if (theme.audio) {
      theme.absoluteAudio = resolveThemeAssetPath(theme.audio);
    }
  });
}

// 应用初始化
app.whenReady().then(() => {
  processThemesWithAbsolutePaths();
  createWindow();
  
  // 注册IPC处理程序
  setupIPC();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 设置IPC通信
function setupIPC() {
  // 获取配置
  ipcMain.handle('get-config', () => {
    return loadConfig();
  });
  
  // 保存配置
  ipcMain.handle('save-config', (event, config) => {
    // 合并当前配置，防止覆盖其他字段
    const currentConfig = loadConfig();
    const mergedConfig = { ...currentConfig, ...config };
    return saveConfig(mergedConfig);
  });
  
  // 获取主题列表
  ipcMain.handle('get-themes', () => {
    return themes;
  });
  
  // 获取资源绝对路径
  ipcMain.handle('get-asset-path', (event, relativePath) => {
    return resolveThemeAssetPath(relativePath);
  });
  
  // 处理设置窗口关闭请求
  ipcMain.on('close-settings-window', () => {
    if (settingsWindow) {
      settingsWindow.close();
    }
  });
  
  // 处理设置更新
  ipcMain.on('settings-updated', (event, config) => {
    // 更新主窗口
    if (mainWindow) {
      // 应用"置顶显示"设置
      mainWindow.setAlwaysOnTop(config.alwaysOnTop);
      
      // 更新"显示功德文字"设置
      mainWindow.webContents.send('update-show-text', config.isShowText);
      
      // 更新"自动敲击"设置
      if (config.isAutoTap && !autoTapInterval) {
        startAutoTap();
      } else if (!config.isAutoTap && autoTapInterval) {
        stopAutoTap();
      }
      
      // 更新主题
      mainWindow.webContents.send('update-theme', config.currentTheme);
    }
    
    // 更新托盘菜单
    updateTrayMenu();
  });
}

// 所有窗口关闭时，在macOS中保持应用程序活动状态
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在应用程序退出之前，确保清理资源
app.on('before-quit', () => {
  app.isQuitting = true;
  stopAutoTap();
}); 