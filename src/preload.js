const { contextBridge, ipcRenderer } = require('electron');

// 增加调试信息
console.log('预加载脚本正在初始化...');

// 暴露的API
const exposedApi = {
  invoke: async (channel, ...args) => {
    console.log(`调用IPC: ${channel}`, args);
    try {
      const result = await ipcRenderer.invoke(channel, ...args);
      console.log(`IPC调用结果: ${channel}`, result);
      return result;
    } catch (error) {
      console.error(`IPC调用失败: ${channel}`, error);
      throw error;
    }
  },
  on: (channel, listener) => {
    console.log(`注册IPC监听器: ${channel}`);
    const wrappedListener = (event, ...args) => {
      console.log(`收到IPC事件: ${channel}`, args);
      listener(event, ...args);
    };
    ipcRenderer.on(channel, wrappedListener);
    return () => {
      console.log(`移除IPC监听器: ${channel}`);
      ipcRenderer.removeListener(channel, wrappedListener);
    };
  },
  send: (channel, ...args) => {
    console.log(`发送IPC: ${channel}`, args);
    ipcRenderer.send(channel, ...args);
  },
};

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('ipcRenderer', exposedApi);

console.log('预加载脚本初始化完成，API已暴露');
