import { useState, useEffect } from 'react';
import { useSettingsStore, usePromptStore } from '../store';
import { HotkeyConfig, ExportData } from '../store';
import { ChromeStorage } from '../store/storage';

function Options() {
  const { settings, updateSettings, resetSettings, addToBlacklist, removeFromBlacklist, initialize: initSettings } = useSettingsStore();
  const { prompts, initialize: initPrompts } = usePromptStore();
  const [isRecording, setIsRecording] = useState(false);
  const [tempHotkey, setTempHotkey] = useState<HotkeyConfig | null>(null);
  const [newBlacklistUrl, setNewBlacklistUrl] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    initSettings();
    initPrompts();
  }, [initSettings, initPrompts]);

  const handleHotkeyRecord = () => {
    setIsRecording(true);
    setSuccessMessage(null);
    setImportError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    
    if (e.key === 'Escape') {
      setIsRecording(false);
      return;
    }

    const newHotkey: HotkeyConfig = {
      key: e.key.toUpperCase(),
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
    };
    
    setTempHotkey(newHotkey);
  };

  const handleHotkeySave = () => {
    if (tempHotkey) {
      updateSettings({ hotkey: tempHotkey });
      setIsRecording(false);
      setSuccessMessage('快捷键已保存');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const formatHotkey = (hotkey: HotkeyConfig) => {
    const parts: string[] = [];
    if (hotkey.ctrlKey) parts.push('Ctrl');
    if (hotkey.altKey) parts.push('Alt');
    if (hotkey.shiftKey) parts.push('Shift');
    if (hotkey.metaKey) parts.push('Meta');
    if (hotkey.key) parts.push(hotkey.key);
    return parts.join(' + ');
  };

  const handleAddBlacklist = () => {
    if (newBlacklistUrl.trim()) {
      addToBlacklist(newBlacklistUrl.trim());
      setNewBlacklistUrl('');
    }
  };

  const handleExport = () => {
    const exportData: ExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      prompts,
      settings,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-sidebar-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateImportData = (data: any): data is ExportData => {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || typeof data.version !== 'string') return false;
    if (!data.prompts || !Array.isArray(data.prompts)) return false;
    return true;
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!validateImportData(data)) {
          throw new Error('无效的导入文件格式');
        }
        
        usePromptStore.getState().setPrompts(data.prompts);
        if (data.settings) {
          updateSettings(data.settings);
        }
        setSuccessMessage('导入成功');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : '导入失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">设置</h1>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
        )}

        {importError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {importError}
        </div>
        )}

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">基本设置</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableFloatingBall"
                  checked={settings.enableFloatingBall}
                  onChange={(e) => updateSettings({ enableFloatingBall: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="enableFloatingBall" className="text-sm text-gray-700 dark:text-gray-300">
                  启用悬浮球
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSync"
                  checked={settings.enableSync}
                  onChange={(e) => updateSettings({ enableSync: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="enableSync" className="text-sm text-gray-700 dark:text-gray-300">
                  启用跨设备同步 (使用 Chrome 账号同步数据)
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">快捷键</h2>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    唤出侧边栏
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isRecording ? '录制中...' : formatHotkey(tempHotkey || settings.hotkey)}
                      onKeyDown={handleKeyDown}
                      readOnly
                      className={`w-full px-3 py-2 rounded border ${
                        isRecording ? 'border-red-500 bg-red-50 dark:bg-gray-900 border-gray-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={handleHotkeyRecord}
                    />
                  </div>
                  {isRecording && (
                    <p className="text-xs text-red-500 mt-2">
                      按新的快捷键，按 Esc 取消
                    </p>
                  )}
                </div>
                {isRecording && tempHotkey && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleHotkeySave}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsRecording(false);
                        setTempHotkey(null);
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">黑名单网站</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBlacklistUrl}
                  onChange={(e) => setNewBlacklistUrl(e.target.value)}
                  placeholder="输入网站 URL"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddBlacklist();
                  }}
                />
                <button
                  onClick={handleAddBlacklist}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  添加
                </button>
              </div>
              <div className="space-y-2">
                {settings.blacklist.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">暂无黑名单网站</p>
                ) : (
                  settings.blacklist.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">{url}</span>
                      <button
                        onClick={() => removeFromBlacklist(url)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">数据管理</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  导出数据
                </button>
                <label className="px-4 py-2 bg-green-500 text-white rounded cursor-pointer hover:bg-green-600">
                  导入数据
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <button
                  onClick={async () => {
                    if (confirm('确认要重载内置提示词吗？这将会清空您当前所有的提示词数据并重新加载默认文件！')) {
                      await ChromeStorage.clear();
                      await usePromptStore.getState().initialize(true);
                      setSuccessMessage('提示词已重新加载');
                      setTimeout(() => setSuccessMessage(null), 3000);
                    }
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 mr-3">
                  重载内置提示词 (清空并重新导入)
                </button>
                <button
                  onClick={resetSettings}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  重置所有设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
