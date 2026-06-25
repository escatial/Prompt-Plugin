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
    /**
     * 获取提示词数据 - 智能合并本地和同步数据
     * 策略：取两个区域中数据量更大的那个作为主数据源
     */
    static async getPrompts(): Promise<Prompt[]> {
        try {
            // 同时读取两个区域的数据
            const [localResult, syncResult] = await Promise.all([
                chrome.storage.local.get([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]),
                chrome.storage.sync.get([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]),
            ]);

            const localPrompts = localResult[STORAGE_KEY];
            const syncPrompts = syncResult[STORAGE_KEY];

            const localData = Array.isArray(localPrompts) ? localPrompts : [];
            const syncData = Array.isArray(syncPrompts) ? syncPrompts : [];

            // 判断哪个区域的数据更新（取数据量更大的，因为数据多的通常是更新过的）
            if (localData.length > syncData.length) {
                return localData;
            } else if (syncData.length > localData.length) {
                return syncData;
            } else {
                // 数据量相同时，优先返回同步区域的数据（如果存在）
                return syncData.length > 0 ? syncData : localData;
            }
        } catch {
            return [];
        }
    }

    /**
     * 保存提示词数据 - 同时写入本地和同步区域
     */
    static async savePrompts(prompts: Prompt[]): Promise<void> {
        try {
            // 同时写入两个区域，确保数据同步
            await Promise.all([
                chrome.storage.local.set({ [STORAGE_KEY]: prompts }),
                chrome.storage.sync.set({ [STORAGE_KEY]: prompts }).catch(() => {
                    // 同步区域可能因为配额限制失败，这是正常的
                    // console.warn('Sync storage save failed (quota?)');
                }),
            ]);
        } catch (error) {
            // 如果同步失败，至少确保本地保存成功
            await chrome.storage.local.set({ [STORAGE_KEY]: prompts });
        }
    }

    /**
     * 检查是否已初始化
     */
    static async isInitialized(): Promise<boolean> {
        try {
            const [localResult, syncResult] = await Promise.all([
                chrome.storage.local.get(INITIALIZED_KEY),
                chrome.storage.sync.get(INITIALIZED_KEY),
            ]);
            return localResult[INITIALIZED_KEY] === true || syncResult[INITIALIZED_KEY] === true;
        } catch {
            return false;
        }
    }

    /**
     * 设置初始化标记
     */
    static async setInitialized(value: boolean): Promise<void> {
        try {
            await Promise.all([
                chrome.storage.local.set({ [INITIALIZED_KEY]: value }),
                chrome.storage.sync.set({ [INITIALIZED_KEY]: value }),
            ]);
        } catch {
            await chrome.storage.local.set({ [INITIALIZED_KEY]: value });
        }
    }

    /**
     * 获取设置 - 同时检查两个区域
     */
    static async getSettings(): Promise<Settings> {
        try {
            const [localResult, syncResult] = await Promise.all([
                chrome.storage.local.get(SETTINGS_KEY),
                chrome.storage.sync.get(SETTINGS_KEY),
            ]);

            // 优先使用同步设置
            const data = syncResult[SETTINGS_KEY] || localResult[SETTINGS_KEY];
            return data ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * 保存设置 - 同时写入两个区域
     */
    static async saveSettings(settings: Settings): Promise<void> {
        try {
            await Promise.all([
                chrome.storage.local.set({ [SETTINGS_KEY]: settings }),
                chrome.storage.sync.set({ [SETTINGS_KEY]: settings }),
            ]);
        } catch {
            await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
        }
    }

    /**
     * 清空所有数据
     */
    static async clear(): Promise<void> {
        await Promise.all([
            chrome.storage.local.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]),
            chrome.storage.sync.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY]),
        ]);
    }

    /**
     * 监听存储变化 - 当其他设备同步数据过来时触发
     */
    static onChanged(callback: (changes: { prompts?: Prompt[] }, area: string) => void): void {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            const promptChange = changes[STORAGE_KEY];
            if (promptChange) {
                callback(
                    { prompts: promptChange.newValue as Prompt[] | undefined },
                    areaName,
                );
            }
        });
    }
}