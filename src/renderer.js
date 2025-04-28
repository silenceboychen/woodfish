// DOM元素
const appContainer = document.getElementById('app-container');
const woodfishImg = document.getElementById('woodfish-img');
const stickImg = document.getElementById('stick-img');
const stickContainer = document.querySelector('.stick-container');
const woodfishContainer = document.querySelector('.woodfish-container');
const meritText = document.getElementById('merit-text');

// 音频播放器实例
let audioPlayer = null;

// 应用状态
let config = {
  currentTheme: 0,
  isShowText: true,  // 默认为true，显示功德文字
  currentText: '功德+1',
  totalNumber: 0
};

// 木鱼主题列表
let themes = [];

// 当前敲击计数
let currentTapCount = 0;

// 敲击锁定 - 防止用户过快点击
let tapping = false;

// 初始化应用
async function initApp() {
  try {
    console.log('正在初始化应用...');
    
    // 获取配置
    config = await window.ipcRenderer.invoke('get-config');
    console.log('已加载配置:', config);
    
    // 获取主题列表
    themes = await window.ipcRenderer.invoke('get-themes');
    console.log('已加载主题:', themes);
    
    // 应用当前主题
    applyTheme(config.currentTheme);
    
    // 设置显示文本
    meritText.textContent = config.currentText || '功德+1';
    
    // 根据配置更新UI状态
    updateUIFromConfig();
    
    // 初始化音频播放器
    initAudioPlayer();
  } catch (error) {
    console.error('初始化应用失败:', error);
  }
}

// 根据配置更新UI状态
function updateUIFromConfig() {
  // 处理显示功德文字设置
  if (meritText) {
    meritText.style.display = config.isShowText ? 'block' : 'none';
  }
  
  // 处理显示计数器设置（如果有相关UI元素）
  const counterElement = document.getElementById('counter');
  if (counterElement) {
    counterElement.style.display = config.showCalculateNumber ? 'block' : 'none';
    counterElement.textContent = `${config.totalNumber || 0}`;
  }
  
  console.log('UI状态已根据配置更新');
}

// 初始化音频播放器
function initAudioPlayer() {
  try {
    if (!themes || !themes[config.currentTheme]) {
      console.error('主题未加载或索引无效:', config.currentTheme);
      return;
    }

    const theme = themes[config.currentTheme];
    // 优先使用绝对路径
    const audioPath = theme.absoluteAudio || theme.audio || '../assets/audio/muyu_audio.mp3';
    console.log('初始化音频:', audioPath);

    // 创建新的音频实例
    audioPlayer = new Audio(audioPath);
    audioPlayer.preload = 'auto';
    audioPlayer.volume = 1.0;

    // 处理音频加载错误
    audioPlayer.onerror = (e) => {
      console.error('音频加载失败:', e);
      // 尝试使用IPC获取绝对路径
      if (theme.audio) {
        window.ipcRenderer.invoke('get-asset-path', theme.audio)
          .then(absolutePath => {
            console.log('使用IPC获取的绝对路径加载音频:', absolutePath);
            audioPlayer = new Audio(absolutePath);
            audioPlayer.preload = 'auto';
            audioPlayer.volume = 1.0;
            audioPlayer.load();
          })
          .catch(err => {
            console.error('IPC获取音频绝对路径失败:', err);
          });
      }
    };

    // 预加载音频
    audioPlayer.load();
  } catch (error) {
    console.error('初始化音频播放器失败:', error);
  }
}

// 设置主题
async function setTheme(index) {
  if (index === config.currentTheme) return;
  
  config.currentTheme = index;
  await saveConfig();
  applyTheme(index);
  
  // 重新初始化音频播放器
  initAudioPlayer();
}

// 应用主题
function applyTheme(index) {
  try {
    console.log(`应用主题 ${index}`);
    const theme = themes[index];
    if (!theme) {
      console.error('主题不存在:', index);
      return;
    }

    // 设置背景颜色
    if (theme.color) {
      document.body.style.backgroundColor = theme.color;
    }

    // 设置木鱼图标 - 优先使用绝对路径
    if (theme.absoluteIcon || theme.icon) {
      console.log('设置木鱼图标:', theme.absoluteIcon || theme.icon);
      woodfishImg.src = theme.absoluteIcon || theme.icon;
      
      // 图像加载错误时的处理
      woodfishImg.onerror = (e) => {
        console.error('木鱼图标加载失败:', e);
        // 尝试使用IPC获取绝对路径
        window.ipcRenderer.invoke('get-asset-path', theme.icon)
          .then(absolutePath => {
            console.log('使用IPC获取的绝对路径加载图标:', absolutePath);
            woodfishImg.src = absolutePath;
          })
          .catch(err => {
            console.error('IPC获取绝对路径失败:', err);
          });
      };
    }
  } catch (error) {
    console.error('应用主题失败:', error);
  }
}

// 敲击木鱼
function tap(event) {
  if (tapping) return;
  
  // 如果是拖动操作，不执行敲击
  if (event && event.target && (event.target === appContainer || event.target === document.querySelector('.main-content'))) {
    console.log('忽略拖动区域点击');
    return;
  }
  
  console.log('执行敲击，点击目标:', event ? event.target : '自动敲击');
  tapping = true;
  
  // 添加敲击动画 - 木鱼棒
  stickContainer.classList.add('tap');
  
  // 短暂延迟后播放音效和木鱼动画
  setTimeout(() => {
    // 播放音效
    playTapSound();
    
    // 振动效果
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 添加敲击动画 - 木鱼
    woodfishImg.classList.add('tap');
    
    // 更新计数
    currentTapCount++;
    config.totalNumber++;
    
    // 更新计数器显示
    const counterElement = document.getElementById('counter');
    if (counterElement && config.showCalculateNumber) {
      counterElement.textContent = `${config.totalNumber}`;
    }
    
    // 显示功德文字
    if (config.isShowText) {
      meritText.textContent = config.currentText || '功德+1';
      meritText.classList.add('active');
      setTimeout(() => {
        meritText.classList.remove('active');
      }, 500);
    }
    
    // 保存配置（每10次敲击保存一次，减少IO操作）
    if (config.totalNumber % 10 === 0) {
      console.log(`累计敲击${config.totalNumber}次，保存配置`);
      // 先从主进程获取最新配置
      window.ipcRenderer.invoke('get-config').then(latestConfig => {
        // 合并当前内存中的配置和最新配置
        const mergedConfig = {
          ...latestConfig,
          totalNumber: config.totalNumber // 只更新总敲击次数
        };
        // 更新内存中的配置
        config = mergedConfig;
        // 保存合并后的配置
        return saveConfig();
      }).then(success => {
        if (success) {
          console.log('保存成功');
        } else {
          console.error('保存失败');
        }
      }).catch(err => {
        console.error('保存过程出错:', err);
      });
    }
  }, 150);
  
  // 短暂延迟后恢复
  setTimeout(() => {
    woodfishImg.classList.remove('tap');
    
    // 再延迟一点恢复木鱼棒
    setTimeout(() => {
      stickContainer.classList.remove('tap');
      tapping = false;
    }, 100);
  }, 300);
}

// 播放敲击音效
function playTapSound() {
  if (!audioPlayer) {
    console.error('音频播放器未初始化');
    // 尝试重新初始化音频播放器
    initAudioPlayer();
    return;
  }
  
  try {
    // 重置音频并播放
    audioPlayer.currentTime = 0;
    const playPromise = audioPlayer.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('播放音频失败:', error);
        // 用户交互问题，尝试重新初始化
        initAudioPlayer();
      });
    }
  } catch (error) {
    console.error('播放音频时出错:', error);
  }
}

// 保存配置
async function saveConfig() {
  try {
    // 确保配置对象有效
    if (!config) {
      console.error('配置对象无效');
      return false;
    }
    
    // 确保配置对象可序列化
    const configCopy = { ...config };
    
    // 移除可能导致循环引用的属性
    if (configCopy.audioPlayer) delete configCopy.audioPlayer;
    
    // 确保保留用户的设置选项
    configCopy.isShowText = config.isShowText;
    configCopy.isAutoTap = config.isAutoTap;
    configCopy.showCalculateNumber = config.showCalculateNumber;
    configCopy.alwaysOnTop = config.alwaysOnTop;
    configCopy.currentTheme = config.currentTheme;
    
    console.log('保存配置:', configCopy);
    
    // 尝试保存配置
    const result = await window.ipcRenderer.invoke('save-config', configCopy);
    if (!result) {
      console.error('保存配置失败: 主进程返回失败');
    }
    return result;
  } catch (error) {
    console.error('保存配置失败:', error);
    return false;
  }
}

// 事件监听器
woodfishContainer.addEventListener('click', tap);
woodfishImg.addEventListener('click', tap); // 直接为木鱼图像添加点击事件

// 鼠标悬停效果
woodfishContainer.addEventListener('mouseenter', () => {
  woodfishImg.style.transform = 'scale(1.05)';
});

woodfishContainer.addEventListener('mouseleave', () => {
  if (!woodfishImg.classList.contains('tap')) {
    woodfishImg.style.transform = '';
  }
});

// 接收自动敲击消息
window.ipcRenderer.on('auto-tap', () => {
  tap();
});

// 更新文字显示状态
window.ipcRenderer.on('update-show-text', (event, value) => {
  config.isShowText = value;
  if (meritText) {
    meritText.style.display = value ? 'block' : 'none';
  }
  console.log('更新文字显示状态:', value);
});

// 更新计数器显示状态
window.ipcRenderer.on('update-show-counter', (event, value) => {
  config.showCalculateNumber = value;
  const counterElement = document.getElementById('counter');
  if (counterElement) {
    counterElement.style.display = value ? 'block' : 'none';
  }
  console.log('更新计数器显示状态:', value);
});

// 监听主题切换事件
window.ipcRenderer.on('update-theme', (event, themeIndex) => {
  console.log('收到主题切换事件:', themeIndex);
  if (themes && themes[themeIndex]) {
    applyTheme(themeIndex);
    config.currentTheme = themeIndex;
    // 重新初始化音频播放器以使用新主题的音效
    initAudioPlayer();
  } else {
    console.error('无效的主题索引:', themeIndex);
  }
});

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp); 