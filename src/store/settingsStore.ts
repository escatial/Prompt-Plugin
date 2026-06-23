import { create } from 'zustand';
import { Settings, SettingsStore } from './types';
import { ChromeStorage, DEFAULT_SETTINGS } from './storage';

const saveToStorage = async (settings: Settings) => {
    await ChromeStorage.saveSettings(settings);
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    isLoading: false,

    updateSettings: (updates) => {
        const newSettings = { ...get().settings, ...updates };
        set({ settings: newSettings });
        saveToStorage(newSettings);
    },

    resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        saveToStorage(DEFAULT_SETTINGS);
    },

    addToBlacklist: (url) => {
        const { settings } = get();
        if (!settings.blacklist.includes(url)) {
            const newSettings = {
                ...settings,
                blacklist: [...settings.blacklist, url],
            };
            set({ settings: newSettings });
            saveToStorage(newSettings);
        }
    },

    removeFromBlacklist: (url) => {
        const { settings } = get();
        const newSettings = {
            ...settings,
            blacklist: settings.blacklist.filter(u => u !== url),
        };
        set({ settings: newSettings });
        saveToStorage(newSettings);
    },

    initialize: async () => {
        set({ isLoading: true });
        try {
            const settings = await ChromeStorage.getSettings();
            set({ settings, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },
}));
