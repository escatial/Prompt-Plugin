export interface Prompt {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    isFavorite: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PromptStoreState {
    prompts: Prompt[];
    isLoading: boolean;
    error: string | null;
    selectedPromptId: string | null;
    searchQuery: string;
    categoryFilter: string | null;
    tagFilter: string | null;
    showFavoritesOnly: boolean;
    focusedPromptIndex: number;
}

export interface CategoryInfo {
    name: string;
    count: number;
}

export interface TagInfo {
    name: string;
    count: number;
}

export interface PromptStoreActions {
    getFilteredPrompts: () => Prompt[];
    getAllCategories: () => CategoryInfo[];
    getAllTags: () => TagInfo[];
    setPrompts: (prompts: Prompt[]) => void;
    addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePrompt: (id: string, updates: Partial<Omit<Prompt, 'id' | 'createdAt'>>) => void;
    deletePrompt: (id: string) => void;
    toggleFavorite: (id: string) => void;
    setSelectedPromptId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    setCategoryFilter: (category: string | null) => void;
    setTagFilter: (tag: string | null) => void;
    setShowFavoritesOnly: (show: boolean) => void;
    setFocusedPromptIndex: (index: number) => void;
    clearFilters: () => void;
    initialize: (forceReload?: boolean) => Promise<void>;
}

export type PromptStore = PromptStoreState & PromptStoreActions;

export type Theme = 'light' | 'dark' | 'system';
export type SidebarBehavior = 'fixed' | 'floating';

export interface HotkeyConfig {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
}

export interface Settings {
    theme: Theme;
    sidebarBehavior: SidebarBehavior;
    hotkey: HotkeyConfig;
    blacklist: string[];
    enableFloatingBall: boolean;
    enableSync: boolean; // 新增：是否启用跨设备同步
}

export interface SettingsStoreState {
    settings: Settings;
    isLoading: boolean;
}

export interface SettingsStoreActions {
    updateSettings: (updates: Partial<Settings>) => void;
    resetSettings: () => void;
    addToBlacklist: (url: string) => void;
    removeFromBlacklist: (url: string) => void;
    initialize: () => Promise<void>;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

export interface ExportData {
    version: string;
    exportDate: string;
    prompts: Prompt[];
    settings: Settings;
}
