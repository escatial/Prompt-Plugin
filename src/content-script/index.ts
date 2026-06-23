let lastFocusedElement: HTMLElement | null = null;
let floatingBall: HTMLDivElement | null = null;
let isFloatingBallVisible = false;

const isEditableElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' && ['text', 'search', 'url', 'tel', 'email', 'password'].includes((element as HTMLInputElement).type)) {
    return true;
  }
  
  if (tagName === 'textarea') {
    return true;
  }
  
  if (element.isContentEditable) {
    return true;
  }
  
  return false;
};

const findEditableElement = (element: Element): HTMLElement | null => {
  if (isEditableElement(element as HTMLElement)) {
    return element as HTMLElement;
  }
  
  if (element.shadowRoot) {
    const shadowElements = Array.from(element.shadowRoot.querySelectorAll('*'));
    for (const el of shadowElements) {
      if (isEditableElement(el as HTMLElement)) {
        return el as HTMLElement;
      }
    }
  }
  
  return null;
};

const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  const editableElement = findEditableElement(target);
  
  if (editableElement) {
    lastFocusedElement = editableElement;
    showFloatingBall();
  }
};

const handleFocusOut = () => {
  setTimeout(() => {
    if (!document.activeElement || !isEditableElement(document.activeElement as HTMLElement)) {
      hideFloatingBall();
    }
  }, 100);
};

const setCursorAtEnd = (element: HTMLElement) => {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea') {
    const el = element as HTMLInputElement | HTMLTextAreaElement;
    const length = el.value.length;
    el.focus();
    el.setSelectionRange(length, length);
  } else if (element.isContentEditable) {
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};

const handleFillText = (text: string) => {
  if (!lastFocusedElement) {
    return;
  }
  
  const element = lastFocusedElement;
  const tagName = element.tagName.toLowerCase();
  
  // 确保元素重新获得焦点，因为点击侧边栏时页面可能失去了焦点
  element.focus();
  
  if (tagName === 'input' || tagName === 'textarea') {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const newValue = input.value.substring(0, start) + text + input.value.substring(end);
    
    // 使用原生 setter 以兼容 React 等现代前端框架
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    
    if (tagName === 'textarea' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(input, newValue);
    } else if (tagName === 'input' && nativeInputValueSetter) {
        nativeInputValueSetter.call(input, newValue);
    } else {
        input.value = newValue;
    }
    
    const newCursorPos = start + text.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    // 恢复选区到末尾，然后再执行插入
    setCursorAtEnd(element);
    document.execCommand('insertText', false, text);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  setCursorAtEnd(element);
};

const createFloatingBall = () => {
  const ball = document.createElement('div');
  ball.id = 'prompt-sidebar-floating-ball';
  ball.style.position = 'fixed';
  ball.style.width = '48px';
  ball.style.height = '48px';
  ball.style.borderRadius = '50%';
  ball.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  ball.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  ball.style.cursor = 'pointer';
  ball.style.zIndex = '2147483647';
  ball.style.display = 'flex';
  ball.style.alignItems = 'center';
  ball.style.justifyContent = 'center';
  ball.style.color = 'white';
  ball.style.fontSize = '24px';
  ball.style.transition = 'transform 0.2s, opacity 0.2s';
  ball.innerHTML = '💬';
  ball.style.userSelect = 'none';
  ball.style.bottom = '24px';
  ball.style.right = '24px';

  ball.addEventListener('mouseenter', () => {
    ball.style.transform = 'scale(1.1)';
  });

  ball.addEventListener('mouseleave', () => {
    ball.style.transform = 'scale(1)';
  });

  ball.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR' });
  });

  let isDragging = false;
  let startX: number, startY: number, startLeft: number, startTop: number;

  ball.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = ball.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    ball.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    ball.style.right = 'auto';
    ball.style.bottom = 'auto';
    ball.style.left = `${startLeft + deltaX}px`;
    ball.style.top = `${startTop + deltaY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    ball.style.cursor = 'pointer';
  });

  return ball;
};

const showFloatingBall = () => {
  if (isFloatingBallVisible) return;
  
  if (!floatingBall) {
    floatingBall = createFloatingBall();
    document.body.appendChild(floatingBall);
  }
  
  floatingBall.style.opacity = '1';
  floatingBall.style.pointerEvents = 'auto';
  isFloatingBallVisible = true;
};

const hideFloatingBall = () => {
  if (!isFloatingBallVisible || !floatingBall) return;
  
  floatingBall.style.opacity = '0';
  floatingBall.style.pointerEvents = 'none';
  isFloatingBallVisible = false;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FILL_TEXT') {
    handleFillText(message.text);
    sendResponse({ success: true });
  } else if (message.type === 'GET_LAST_FOCUSED') {
    sendResponse({
      hasFocused: lastFocusedElement !== null,
      tagName: lastFocusedElement?.tagName,
      isContentEditable: lastFocusedElement?.isContentEditable
    });
  }
});

document.addEventListener('focusin', handleFocusIn, true);
document.addEventListener('focusout', handleFocusOut, true);

if (document.activeElement) {
  const activeElement = document.activeElement as HTMLElement;
  const editableElement = findEditableElement(activeElement);
  if (editableElement) {
    lastFocusedElement = editableElement;
    showFloatingBall();
  }
}

console.log('Prompt Sidebar content script loaded');
