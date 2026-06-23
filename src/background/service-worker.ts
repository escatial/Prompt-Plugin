chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id! });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (tab && (command === 'toggle-sidebar' || command === '_execute_action') && tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_SIDEBAR') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  } else if (message.type === 'SEND_TO_CONTENT' && sender.tab?.id) {
    chrome.tabs.sendMessage(sender.tab.id, message.payload, sendResponse);
    return true;
  }
});
