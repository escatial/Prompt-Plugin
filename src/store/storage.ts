import { Prompt, Settings, HotkeyConfig } from './types';

const STORAGE_KEY = 'prompt-sidebar-prompts';
const INITIALIZED_KEY = 'prompt-sidebar-initialized';
const SETTINGS_KEY = 'prompt-sidebar-settings';
const SYNC_META_KEY = 'prompt-sidebar-sync-meta';

// 同步配额限制：单条 8KB，总量 100KB，最多 512 条
const SYNC_MAX_ITEM_SIZE = 6 * 1024; // 留 2KB 余量
const SYNC_MAX_TOTAL_SIZE = 90 * 1024; // 留 10KB 余量
const SYNC_MAX_ITEMS = 480; // 留 32 条余量

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

export interface SyncResult {
    success: boolean;
    totalItems: number;
    totalSize: number;
    skippedItems: string[]; // 因超限被跳过的提示词 ID
    error?: string;
}

export class ChromeStorage {
    /**
     * 获取提示词数据
     * 读取策略：
     * 1. 优先从本地读取（最完整的数据）
     * 2. 如果本地为空但 sync 有数据，从 sync 拉取
     */
    static async getPrompts(): Promise<Prompt[]> {
        try {
            const localResult = await chrome.storage.local.get([STORAGE_KEY, INITIALIZED_KEY]);

            const localData = Array.isArray(localResult[STORAGE_KEY]) ? localResult[STORAGE_KEY] : [];

            // 本地有数据，优先返回本地
            if (localData.length > 0) {
                return localData;
            }

            // 本地为空，尝试从 sync 区域拉取
            const syncPrompts = await this.getPromptsFromSync();
            if (syncPrompts.length > 0) {
                // 同步到本地（避免下次再走 sync 拉取）
                await chrome.storage.local.set({ [STORAGE_KEY]: syncPrompts });
                return syncPrompts;
            }

            return localData;
        } catch (error) {
            console.error('[Storage] getPrompts error:', error);
            return [];
        }
    }

    /**
     * 从 sync 区域分片读取数据
     */
    private static async getPromptsFromSync(): Promise<Prompt[]> {
        try {
            // 读取分片元数据
            const metaResult = await chrome.storage.sync.get(SYNC_META_KEY);
            const meta = metaResult[SYNC_META_KEY] as { totalShards: number; updatedAt: string } | undefined;

            if (!meta || meta.totalShards === 0) {
                // 兼容老版本：尝试读取单条数据
                const directResult = await chrome.storage.sync.get(STORAGE_KEY);
                const direct = directResult[STORAGE_KEY];
                if (Array.isArray(direct)) {
                    return direct;
                }
                return [];
            }

            // 读取所有分片
            const shardKeys: string[] = [];
            for (let i = 0; i < meta.totalShards; i++) {
                shardKeys.push(`${STORAGE_KEY}_shard_${i}`);
            }

            const shardResult = await chrome.storage.sync.get(shardKeys);
            const prompts: Prompt[] = [];

            for (let i = 0; i < meta.totalShards; i++) {
                const shardData = shardResult[`${STORAGE_KEY}_shard_${i}`];
                if (Array.isArray(shardData)) {
                    prompts.push(...shardData);
                }
            }

            return prompts;
        } catch (error) {
            console.error('[Storage] getPromptsFromSync error:', error);
            return [];
        }
    }

    /**
     * 保存提示词数据
     * 写入策略：
     * 1. 本地存储保存完整数据
     * 2. 同步存储自动分片，并跳过超限项目
     */
    static async savePrompts(prompts: Prompt[]): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            totalItems: prompts.length,
            totalSize: 0,
            skippedItems: [],
        };

        try {
            // 1. 本地保存（无限制）
            await chrome.storage.local.set({ [STORAGE_KEY]: prompts });

            // 2. 同步保存（分片 + 跳过超限项）
            const syncResult = await this.savePromptsToSync(prompts);
            result.success = syncResult.success;
            result.totalSize = syncResult.totalSize;
            result.skippedItems = syncResult.skippedItems;
            result.error = syncResult.error;

            return result;
        } catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : 'Unknown error';
            return result;
        }
    }

    /**
     * 分片保存到 sync 区域
     */
    private static async savePromptsToSync(prompts: Prompt[]): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            totalItems: prompts.length,
            totalSize: 0,
            skippedItems: [],
        };

        try {
            // 先清理旧分片
            const oldMeta = await chrome.storage.sync.get(SYNC_META_KEY);
            const oldMetaData = oldMeta[SYNC_META_KEY] as { totalShards: number } | undefined;
            if (oldMetaData && oldMetaData.totalShards > 0) {
                const oldKeys: string[] = [];
                for (let i = 0; i < oldMetaData.totalShards; i++) {
                    oldKeys.push(`${STORAGE_KEY}_shard_${i}`);
                }
                await chrome.storage.sync.remove(oldKeys);
            }
            await chrome.storage.sync.remove([STORAGE_KEY]); // 清理老版本单条数据

            // 分片策略：按大小分片（每片不超过 6KB）
            const shards: Prompt[][] = [[]];
            let currentShardSize = 0;
            const SHARD_OVERHEAD = 200; // JSON 包装 + key 开销估算

            for (const prompt of prompts) {
                const promptSize = JSON.stringify(prompt).length + SHARD_OVERHEAD;

                // 单条超限，跳过
                if (promptSize > SYNC_MAX_ITEM_SIZE) {
                    result.skippedItems.push(prompt.id);
                    continue;
                }

                // 当前分片加上这条会超限，开启新分片
                if (currentShardSize + promptSize > SYNC_MAX_ITEM_SIZE) {
                    shards.push([]);
                    currentShardSize = 0;
                }

                shards[shards.length - 1].push(prompt);
                currentShardSize += promptSize;
                result.totalSize += promptSize;
            }

            // 检查总大小和分片数
            if (result.totalSize > SYNC_MAX_TOTAL_SIZE) {
                result.success = false;
                result.error = `同步数据总大小超限（${result.totalSize} > ${SYNC_MAX_TOTAL_SIZE}）`;
                return result;
            }

            if (shards.length > SYNC_MAX_ITEMS) {
                result.success = false;
                result.error = `同步分片数超限（${shards.length} > ${SYNC_MAX_ITEMS}）`;
                return result;
            }

            // 写入所有分片
            const shardData: Record<string, Prompt[]> = {};
            shards.forEach((shard, index) => {
                shardData[`${STORAGE_KEY}_shard_${index}`] = shard;
            });

            // 分批写入（每批最多 20 个分片）
            const BATCH_SIZE = 20;
            for (let i = 0; i < shards.length; i += BATCH_SIZE) {
                const batch: Record<string, Prompt[]> = {};
                const end = Math.min(i + BATCH_SIZE, shards.length);
                for (let j = i; j < end; j++) {
                    batch[`${STORAGE_KEY}_shard_${j}`] = shards[j];
                }
                await chrome.storage.sync.set(batch);
            }

            // 写入元数据
            await chrome.storage.sync.set({
                [SYNC_META_KEY]: {
                    totalShards: shards.length,
                    updatedAt: new Date().toISOString(),
                },
            });

            // 同步初始化标记
            await chrome.storage.sync.set({ [INITIALIZED_KEY]: true });

            return result;
        } catch (error) {
            result.success = false;
            result.error = error instanceof Error ? error.message : 'Sync save failed';
            console.error('[Storage] savePromptsToSync error:', error);
            return result;
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
     * 保存设置
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
        // 清理所有分片
        const meta = await chrome.storage.sync.get(SYNC_META_KEY);
        const metaData = meta[SYNC_META_KEY] as { totalShards: number } | undefined;
        if (metaData && metaData.totalShards > 0) {
            const shardKeys: string[] = [];
            for (let i = 0; i < metaData.totalShards; i++) {
                shardKeys.push(`${STORAGE_KEY}_shard_${i}`);
            }
            await chrome.storage.sync.remove(shardKeys);
        }

        await Promise.all([
            chrome.storage.local.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY, SYNC_META_KEY]),
            chrome.storage.sync.remove([STORAGE_KEY, INITIALIZED_KEY, SETTINGS_KEY, SYNC_META_KEY]),
        ]);
    }

    /**
     * 获取同步状态信息
     */
    static async getSyncStatus(): Promise<{
        enabled: boolean;
        itemCount: number;
        totalSize: number;
        lastSyncTime: string | null;
    }> {
        try {
            const settings = await this.getSettings();
            const meta = await chrome.storage.sync.get(SYNC_META_KEY);
            const metaData = meta[SYNC_META_KEY] as { totalShards: number; updatedAt: string } | undefined;

            // 计算已用空间
            const usage = await chrome.storage.sync.getBytesInUse();

            return {
                enabled: settings.enableSync,
                itemCount: metaData?.totalShards || 0,
                totalSize: usage,
                lastSyncTime: metaData?.updatedAt || null,
            };
        } catch {
            return { enabled: false, itemCount: 0, totalSize: 0, lastSyncTime: null };
        }
    }

    /**
     * 监听存储变化 - 当其他设备同步数据过来时触发
     */
    static onChanged(callback: (changes: { prompts?: Prompt[] }, area: string) => void): void {
        chrome.storage.onChanged.addListener(async (changes, areaName) => {
            // 监听分片变化
            const shardChanges: string[] = [];
            for (const key of Object.keys(changes)) {
                if (key.startsWith(`${STORAGE_KEY}_shard_`) || key === STORAGE_KEY) {
                    shardChanges.push(key);
                }
            }

            if (shardChanges.length > 0) {
                // 重新加载所有分片
                const newPrompts = await this.getPrompts();
                callback({ prompts: newPrompts }, areaName);
            }
        });
    }
}