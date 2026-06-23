import { Prompt, Settings, HotkeyConfig } from './types';

const STORAGE_KEY = 'prompt-sidebar-prompts';
const INITIALIZED_KEY = 'prompt-sidebar-initialized';
const SETTINGS_KEY = 'prompt-sidebar-settings';

export const DEFAULT_HOTKEY: HotkeyConfig = {
    key: 'Q',
    altKey: true,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
};

export const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    sidebarBehavior: 'fixed',
    hotkey: DEFAULT_HOTKEY,
    blacklist: [],
    enableFloatingBall: true,
    enableSync: true,
};

export class ChromeStorage {
    private static async getStorageArea(): Promise<chrome.storage.StorageArea> {
        try {
            // 先读取本地设置看是否启用了同步
            const result = await chrome.storage.local.get(SETTINGS_KEY);
            const settings = result[SETTINGS_KEY] as Settings;
            return settings?.enableSync ? chrome.storage.sync : chrome.storage.local;
        } catch {
            return chrome.storage.local;
        }
    }

    static async getPrompts(): Promise<Prompt[]> {
        const area = await this.getStorageArea();
        const result = await area.get(STORAGE_KEY);
        const data = result[STORAGE_KEY];
        return Array.isArray(data) ? data : [];
    }

    static async savePrompts(prompts: Prompt[]): Promise<void> {
        const area = await this.getStorageArea();
        await area.set({ [STORAGE_KEY]: prompts });
    }

    static async isInitialized(): Promise<boolean> {
        const area = await this.getStorageArea();
        const result = await area.get(INITIALIZED_KEY);
        const data = result[INITIALIZED_KEY];
        return typeof data === 'boolean' ? data : false;
    }

    static async setInitialized(value: boolean): Promise<void> {
        const area = await this.getStorageArea();
        await area.set({ [INITIALIZED_KEY]: value });
    }

    static async getSettings(): Promise<Settings> {
        // 设置总是存在 local 中，因为同步设置本身需要最先被读取
        const result = await chrome.storage.local.get(SETTINGS_KEY);
        const data = result[SETTINGS_KEY];
        return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
    }

    static async saveSettings(settings: Settings): Promise<void> {
        const oldSettings = await this.getSettings();
        
        // 如果同步状态发生改变，需要进行数据迁移
        if (oldSettings.enableSync !== settings.enableSync) {
            const oldArea = oldSettings.enableSync ? chrome.storage.sync : chrome.storage.local;
            const newArea = settings.enableSync ? chrome.storage.sync : chrome.storage.local;
            
            // 读取旧数据
            const promptsResult = await oldArea.get(STORAGE_KEY);
            const initResult = await oldArea.get(INITIALIZED_KEY);
            
            // 写入新区域
            if (promptsResult[STORAGE_KEY]) {
                await newArea.set({ [STORAGE_KEY]: promptsResult[STORAGE_KEY] });
            }
            if (initResult[INITIALIZED_KEY] !== undefined) {
                await newArea.set({ [INITIALIZED_KEY]: initResult[INITIALIZED_KEY] });
            }
            
            // 清理旧区域数据（可选）
            await oldArea.remove([STORAGE_KEY, INITIALIZED_KEY]);
        }
        
        await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    }

    static async clear(): Promise<void> {
        const area = await this.getStorageArea();
        await area.remove([STORAGE_KEY, INITIALIZED_KEY]);
        await chrome.storage.local.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]);
        await chrome.storage.sync.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]);
    }
}
