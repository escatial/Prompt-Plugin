import { create } from 'zustand';
import { Prompt, PromptStore, CategoryInfo, TagInfo } from './types';
import { ChromeStorage } from './storage';
import { parseMarkdownToPrompts } from './parseMarkdown';
import mdContent from '../../prompt.md?raw';

const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const saveToStorage = async (prompts: Prompt[]) => {
    await ChromeStorage.savePrompts(prompts);
};

interface SearchIndex {
    [key: string]: {
        promptId: string;
        searchText: string;
    };
}

const buildSearchIndex = (prompts: Prompt[]): SearchIndex => {
    const index: SearchIndex = {};
    prompts.forEach(prompt => {
        const searchText = [
            prompt.title.toLowerCase(),
            prompt.content.toLowerCase(),
            prompt.category.toLowerCase(),
            ...prompt.tags.map(tag => tag.toLowerCase())
        ].join(' ');
        index[prompt.id] = { promptId: prompt.id, searchText };
    });
    return index;
};

const filterPrompts = (
    prompts: Prompt[],
    searchQuery: string,
    categoryFilter: string | null,
    tagFilter: string | null,
    showFavoritesOnly: boolean,
    searchIndex: SearchIndex
): Prompt[] => {
    let filtered = prompts;
    
    if (showFavoritesOnly) {
        filtered = filtered.filter(prompt => prompt.isFavorite);
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(prompt => prompt.category === categoryFilter);
    }
    
    if (tagFilter) {
        filtered = filtered.filter(prompt => prompt.tags.includes(tagFilter));
    }
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(prompt => {
                const indexEntry = searchIndex[prompt.id];
                if (!indexEntry) return false;
                return indexEntry.searchText.includes(query);
            });
        }
    }
    
    return filtered;
};

export const usePromptStore = create<PromptStore>((set, get) => {
    let searchIndex: SearchIndex = {};

    return {
        prompts: [],
        isLoading: false,
        error: null,
        selectedPromptId: null,
        searchQuery: '',
        categoryFilter: null,
        tagFilter: null,
        showFavoritesOnly: false,
        focusedPromptIndex: 0,

        getFilteredPrompts: () => {
            const { prompts, searchQuery, categoryFilter, tagFilter, showFavoritesOnly } = get();
            return filterPrompts(prompts, searchQuery, categoryFilter, tagFilter, showFavoritesOnly, searchIndex);
        },

        getAllCategories: () => {
            const { prompts } = get();
            const categoryMap: Record<string, number> = {};
            
            prompts.forEach(prompt => {
                categoryMap[prompt.category] = (categoryMap[prompt.category] || 0) + 1;
            });
            
            const categories: CategoryInfo[] = Object.entries(categoryMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
            
            return categories;
        },

        getAllTags: () => {
            const { prompts } = get();
            const tagMap: Record<string, number> = {};
            
            prompts.forEach(prompt => {
                prompt.tags.forEach(tag => {
                    tagMap[tag] = (tagMap[tag] || 0) + 1;
                });
            });
            
            const tags: TagInfo[] = Object.entries(tagMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            
            return tags;
        },

        setPrompts: (prompts) => {
        searchIndex = buildSearchIndex(prompts);
        set({ prompts });
        ChromeStorage.savePrompts(prompts);
    },

        addPrompt: (promptData) => {
            const newPrompt: Prompt = {
                ...promptData,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const newPrompts = [...get().prompts, newPrompt];
            set({ prompts: newPrompts });
            searchIndex = buildSearchIndex(newPrompts);
            saveToStorage(newPrompts);
        },

        updatePrompt: (id, updates) => {
            const updatedPrompts = get().prompts.map(prompt => {
                if (prompt.id === id) {
                    return {
                        ...prompt,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return prompt;
            });
            set({ prompts: updatedPrompts });
            searchIndex = buildSearchIndex(updatedPrompts);
            saveToStorage(updatedPrompts);
        },

        deletePrompt: (id) => {
            const filteredPrompts = get().prompts.filter(p => p.id !== id);
            const { selectedPromptId } = get();
            const newSelectedId = selectedPromptId === id ? null : selectedPromptId;
            set({ prompts: filteredPrompts, selectedPromptId: newSelectedId });
            searchIndex = buildSearchIndex(filteredPrompts);
            saveToStorage(filteredPrompts);
        },

        toggleFavorite: (id) => {
            const updatedPrompts = get().prompts.map(prompt => {
                if (prompt.id === id) {
                    return {
                        ...prompt,
                        isFavorite: !prompt.isFavorite,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return prompt;
            });
            set({ prompts: updatedPrompts });
            saveToStorage(updatedPrompts);
        },

        setSelectedPromptId: (id) => set({ selectedPromptId: id }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setCategoryFilter: (category) => set({ categoryFilter: category }),
        setTagFilter: (tag) => set({ tagFilter: tag }),
        setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),
        setFocusedPromptIndex: (index) => set({ focusedPromptIndex: index }),

        clearFilters: () => set({
            searchQuery: '',
            categoryFilter: null,
            tagFilter: null,
            showFavoritesOnly: false,
        }),

        initialize: async (forceReload = false) => {
            set({ isLoading: true, error: null });
            try {
                const isInitialized = await ChromeStorage.isInitialized();
                let prompts: Prompt[];
                if (!isInitialized || forceReload) {
                    // 使用 markdown 文件解析的初始数据
                    const parsedPrompts = parseMarkdownToPrompts(mdContent);
                    await ChromeStorage.savePrompts(parsedPrompts);
                    await ChromeStorage.setInitialized(true);
                    prompts = parsedPrompts;
                } else {
                    prompts = await ChromeStorage.getPrompts();
                }
                searchIndex = buildSearchIndex(prompts);
                set({ prompts, isLoading: false });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : '初始化失败',
                    isLoading: false,
                });
            }
        },
    };
});
