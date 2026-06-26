// 标记 Service Worker 是否已初始化
let isInitialized = false;

// Service Worker 初始化
const initializeServiceWorker = () => {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[Prompt Sidebar] Service Worker initializing...');

  // 关键修复：使用 try-catch 包装，确保即使失败也不影响其他功能
  try {
    // 设置点击 action 图标时自动打开侧边栏
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('[Prompt Sidebar] setPanelBehavior failed:', err));
  } catch (err) {
    console.warn('[Prompt Sidebar] setPanelBehavior error:', err);
  }
};

// 立即执行初始化
initializeServiceWorker();

// 监听安装事件（首次安装 + 更新）
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Prompt Sidebar] Extension installed/updated');
  initializeServiceWorker();
});

// 监听启动事件（Service Worker 唤醒时）
chrome.runtime.onStartup.addListener(() => {
  console.log('[Prompt Sidebar] Browser startup');
  initializeServiceWorker();
});

// 点击浏览器工具栏图标时打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Prompt Sidebar] Action clicked, tab:', tab?.id);
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('[Prompt Sidebar] Side panel opened via action click');
    } catch (err) {
      console.error('[Prompt Sidebar] Failed to open side panel:', err);
    }
  }
});

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('[Prompt Sidebar] Command received:', command, 'tab:', tab?.id);
  if (tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('[Prompt Sidebar] Side panel opened via command');
    } catch (err) {
      console.error('[Prompt Sidebar] Failed to open side panel via command:', err);
    }
  }
});

// 监听来自 content-script 或 sidepanel 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Prompt Sidebar] Message received:', message?.type);

  if (message?.type === 'OPEN_SIDEBAR') {
    // 从 content-script 打开侧边栏
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          await chrome.sidePanel.open({ tabId: tabs[0].id });
          sendResponse({ success: true });
        } catch (err) {
          console.error('[Prompt Sidebar] Failed to open via message:', err);
          sendResponse({ success: false, error: String(err) });
        }
      } else {
        sendResponse({ success: false, error: 'No active tab' });
      }
    });
    return true; // 异步响应
  }

  if (message?.type === 'SEND_TO_CONTENT' && sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, message.payload, sendResponse);
    return true;
  }

  // 健康检查
  if (message?.type === 'PING') {
    sendResponse({ success: true, message: 'pong', version: '0.1.9' });
    return true;
  }
});

console.log('[Prompt Sidebar] Service Worker loaded');