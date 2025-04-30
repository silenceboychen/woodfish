// DOM 元素
const alwaysOnTopToggle = document.getElementById('alwaysOnTop');
const visibleOnAllSpacesToggle = document.getElementById('visibleOnAllSpaces');
const autoTapToggle = document.getElementById('autoTap');
const showTextToggle = document.getElementById('showText');
const customTextInput = document.getElementById('customText');
const themeSelector = document.getElementById('themeSelector');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');

// 当前配置和主题列表
let currentConfig = {};
let themesList = [];

// 初始化设置窗口
async function initSettings() {
  try {
    // 获取配置和主题
    currentConfig = await window.ipcRenderer.invoke('get-config');
    themesList = await window.ipcRenderer.invoke('get-themes');

    console.log('设置窗口已加载配置:', currentConfig);
    console.log('主题列表:', themesList);

    // 应用当前配置到UI
    updateUIFromConfig();

    // 生成主题选择器
    renderThemeOptions();

    // 添加事件监听
    addEventListeners();
  } catch (error) {
    console.error('初始化设置窗口失败:', error);
    showError('加载设置失败，请重试');
  }
}

// 根据配置更新UI
function updateUIFromConfig() {
  // 更新开关状态
  alwaysOnTopToggle.checked = currentConfig.alwaysOnTop || false;
  visibleOnAllSpacesToggle.checked = currentConfig.visibleOnAllSpaces || false;
  autoTapToggle.checked = currentConfig.isAutoTap || false;
  showTextToggle.checked = currentConfig.isShowText || false;

  // 更新文本输入
  customTextInput.value = currentConfig.currentText || '功德+1';
}

// 生成主题选择器
function renderThemeOptions() {
  themeSelector.innerHTML = '';

  themesList.forEach((theme, index) => {
    const themeOption = document.createElement('div');
    themeOption.className = 'theme-option';
    if (index === currentConfig.currentTheme) {
      themeOption.classList.add('active');
    }

    // 设置背景色
    themeOption.style.backgroundColor = theme.color || '#ffffff';

    // 创建主题图标
    const img = document.createElement('img');
    img.src = theme.absoluteIcon || theme.icon || '';
    img.alt = theme.name || `主题 ${index + 1}`;
    img.onerror = function () {
      // 如果图片加载失败，尝试使用IPC获取绝对路径
      window.ipcRenderer.invoke('get-asset-path', theme.icon)
        .then((absolutePath) => {
          img.src = absolutePath;
        })
        .catch((err) => {
          console.error('获取主题图片失败:', err);
        });
    };

    // 创建主题名称标签
    const nameLabel = document.createElement('div');
    nameLabel.className = 'theme-name';
    nameLabel.textContent = theme.name || `主题 ${index + 1}`;

    // 添加点击事件
    themeOption.setAttribute('data-index', index);
    themeOption.addEventListener('click', function () {
      // 移除所有的active类
      document.querySelectorAll('.theme-option').forEach((el) => {
        el.classList.remove('active');
      });

      // 添加active类到当前选中的主题
      this.classList.add('active');

      // 更新当前选中的主题
      currentConfig.currentTheme = parseInt(this.getAttribute('data-index'), 10);
    });

    // 将元素添加到主题选择器
    themeOption.appendChild(img);
    themeOption.appendChild(nameLabel);
    themeSelector.appendChild(themeOption);
  });
}

// 添加事件监听
function addEventListeners() {
  // 保存按钮
  saveButton.addEventListener('click', saveSettings);

  // 取消按钮
  cancelButton.addEventListener('click', function () {
    window.ipcRenderer.send('close-settings-window');
  });

  // 监听配置变更
  alwaysOnTopToggle.addEventListener('change', function () {
    currentConfig.alwaysOnTop = this.checked;
  });

  visibleOnAllSpacesToggle.addEventListener('change', function () {
    currentConfig.visibleOnAllSpaces = this.checked;
  });

  autoTapToggle.addEventListener('change', function () {
    currentConfig.isAutoTap = this.checked;
  });

  showTextToggle.addEventListener('change', function () {
    currentConfig.isShowText = this.checked;
  });

  customTextInput.addEventListener('input', function () {
    currentConfig.currentText = this.value;
  });
}

// 保存设置
async function saveSettings() {
  try {
    console.log('保存设置:', currentConfig);
    const result = await window.ipcRenderer.invoke('save-config', currentConfig);

    if (result) {
      console.log('设置保存成功');
      showSuccess('设置已保存');

      // 通知主进程更新设置
      window.ipcRenderer.send('settings-updated', currentConfig);

      // 关闭设置窗口
      setTimeout(() => {
        window.ipcRenderer.send('close-settings-window');
      }, 2000);
    } else {
      console.error('设置保存失败');
      showError('设置保存失败，请重试');
    }
  } catch (error) {
    console.error('保存设置时出错:', error);
    showError('保存设置时出错');
  }
}

// 显示通知
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const messageElement = notification.querySelector('.notification-message');

  // 设置消息内容
  messageElement.textContent = message;

  // 设置通知类型
  notification.className = 'notification';
  notification.classList.add(type);

  // 显示通知
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // 2秒后自动隐藏
  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
}

// 显示成功消息
function showSuccess(message) {
  showNotification(message, 'success');
}

// 显示错误消息
function showError(message) {
  showNotification(message, 'error');
}

// 当DOM加载完成时初始化设置
document.addEventListener('DOMContentLoaded', initSettings);
