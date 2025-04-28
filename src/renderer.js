// DOM元素
const appContainer = document.getElementById('app-container');
const woodfishImg = document.getElementById('woodfish-img');
const stickImg = document.getElementById('stick-img');
const stickContainer = document.querySelector('.stick-container');
const woodfishContainer = document.querySelector('.woodfish-container');
const meritText = document.getElementById('merit-text');
const currentCounter = document.getElementById('current-counter');
const totalCounter = document.getElementById('total-counter');
const counterDisplay = document.getElementById('counter-display');
const themeSelector = document.getElementById('theme-selector');
const autoTapBtn = document.getElementById('auto-tap-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const autoTapToggle = document.getElementById('auto-tap-toggle');
const showTextToggle = document.getElementById('show-text-toggle');
const customTextInput = document.getElementById('custom-text');
const showCounterToggle = document.getElementById('show-counter-toggle');
const themeSwitcherToggle = document.getElementById('theme-switcher-toggle');
const textInputContainer = document.getElementById('text-input-container');

// 音频播放器实例
let audioPlayer = null;

// 应用状态
let config = {
  currentTheme: 0,
  isShowText: false,
  currentText: '功德+1',
  totalNumber: 0,
  isAutoTap: false,
  showCalculateNumber: true,
  quickChangeAudio: true
};

// 木鱼主题列表
let themes = [];

// 自动敲击定时器
let autoTapInterval = null;

// 当前敲击计数
let currentTapCount = 0;

// 敲击锁定 - 防止用户过快点击
let tapping = false;

// 初始化应用
async function initApp() {
  try {
    // 获取配置
    config = await window.ipcRenderer.invoke('get-config');
    
    // 获取主题列表
    themes = await window.ipcRenderer.invoke('get-themes');
    
    // 渲染主题选择器
    renderThemeSelector();
    
    // 应用当前主题
    applyTheme(config.currentTheme);
    
    // 设置计数器
    totalCounter.textContent = `总计: ${config.totalNumber}`;
    
    // 设置显示文本
    meritText.textContent = config.currentText || '功德+1';
    
    // 设置控件状态
    setControlsState();
    
    // 如果启用了自动敲击，启动自动敲击
    if (config.isAutoTap) {
      startAutoTap();
    }
    
    // 初始化音频播放器
    initAudioPlayer();
  } catch (error) {
    console.error('初始化应用失败:', error);
  }
}

// 初始化音频播放器
function initAudioPlayer() {
  const currentTheme = themes[config.currentTheme];
  const audioPath = currentTheme.audio;
  
  audioPlayer = new Audio(audioPath);
  audioPlayer.preload = 'auto';
}

// 渲染主题选择器
function renderThemeSelector() {
  themeSelector.innerHTML = '';
  
  themes.forEach((theme, index) => {
    const themeOption = document.createElement('div');
    themeOption.className = `theme-option ${index === config.currentTheme ? 'active' : ''}`;
    themeOption.dataset.index = index;
    
    const themeImg = document.createElement('img');
    themeImg.src = theme.icon;
    themeImg.alt = theme.name;
    
    themeOption.appendChild(themeImg);
    themeSelector.appendChild(themeOption);
    
    themeOption.addEventListener('click', () => {
      setTheme(index);
    });
  });
  
  // 显示或隐藏主题选择器
  themeSelector.style.display = config.quickChangeAudio ? 'flex' : 'none';
}

// 设置主题
async function setTheme(index) {
  if (index === config.currentTheme) return;
  
  config.currentTheme = index;
  await saveConfig();
  applyTheme(index);
  
  // 更新主题选择器的激活状态
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    option.classList.toggle('active', parseInt(option.dataset.index) === index);
  });
  
  // 重新初始化音频播放器
  initAudioPlayer();
}

// 应用主题
function applyTheme(index) {
  const theme = themes[index];
  document.body.style.backgroundColor = theme.color;
  woodfishImg.src = theme.icon;
}

// 敲击木鱼
function tap() {
  if (tapping) return;
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
    currentCounter.textContent = currentTapCount;
    totalCounter.textContent = `总计: ${config.totalNumber}`;
    
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
      saveConfig();
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
  if (audioPlayer) {
    // 重置音频并播放
    audioPlayer.currentTime = 0;
    audioPlayer.play().catch(error => {
      console.error('播放音频失败:', error);
    });
  }
}

// 开始自动敲击
function startAutoTap() {
  if (autoTapInterval) return;
  
  config.isAutoTap = true;
  saveConfig();
  
  autoTapInterval = setInterval(() => {
    tap();
  }, 1000);
}

// 停止自动敲击
function stopAutoTap() {
  if (!autoTapInterval) return;
  
  clearInterval(autoTapInterval);
  autoTapInterval = null;
  config.isAutoTap = false;
  saveConfig();
}

// 切换自动敲击状态
function toggleAutoTap() {
  if (config.isAutoTap) {
    stopAutoTap();
  } else {
    startAutoTap();
  }
}

// 保存配置
async function saveConfig() {
  try {
    await window.ipcRenderer.invoke('save-config', config);
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

// 设置控件状态
function setControlsState() {
  // 设置开关状态
  autoTapToggle.checked = config.isAutoTap;
  showTextToggle.checked = config.isShowText;
  showCounterToggle.checked = config.showCalculateNumber;
  themeSwitcherToggle.checked = config.quickChangeAudio;
  
  // 设置文本输入框
  customTextInput.value = config.currentText || '';
  textInputContainer.style.display = config.isShowText ? 'flex' : 'none';
  
  // 设置计数器显示
  counterDisplay.style.display = config.showCalculateNumber ? 'flex' : 'none';
  
  // 设置主题选择器显示
  themeSelector.style.display = config.quickChangeAudio ? 'flex' : 'none';
}

// 事件监听器
woodfishContainer.addEventListener('click', tap);

autoTapBtn.addEventListener('click', toggleAutoTap);

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

autoTapToggle.addEventListener('change', () => {
  config.isAutoTap = autoTapToggle.checked;
  if (config.isAutoTap) {
    startAutoTap();
  } else {
    stopAutoTap();
  }
  saveConfig();
});

showTextToggle.addEventListener('change', () => {
  config.isShowText = showTextToggle.checked;
  textInputContainer.style.display = config.isShowText ? 'flex' : 'none';
  saveConfig();
});

customTextInput.addEventListener('input', () => {
  config.currentText = customTextInput.value;
  saveConfig();
});

showCounterToggle.addEventListener('change', () => {
  config.showCalculateNumber = showCounterToggle.checked;
  counterDisplay.style.display = config.showCalculateNumber ? 'flex' : 'none';
  saveConfig();
});

themeSwitcherToggle.addEventListener('change', () => {
  config.quickChangeAudio = themeSwitcherToggle.checked;
  themeSelector.style.display = config.quickChangeAudio ? 'flex' : 'none';
  saveConfig();
});

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp); 