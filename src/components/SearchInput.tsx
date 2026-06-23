import { useCallback, useEffect, useRef, useState } from 'react';
import { usePromptStore } from '../store';
import { TagCloud } from './TagCloud';

export const SearchInput = () => {
    const { 
        searchQuery, 
        setSearchQuery, 
        showFavoritesOnly, 
        setShowFavoritesOnly, 
        categoryFilter,
        setCategoryFilter,
        tagFilter,
        setTagFilter,
        clearFilters,
        getAllCategories
    } = usePromptStore();
    
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    const categories = getAllCategories();

    const debouncedSetSearchQuery = useCallback((query: string) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setSearchQuery(query);
        }, 100);
    }, [setSearchQuery]);

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalQuery(newValue);
        debouncedSetSearchQuery(newValue);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={localQuery}
                        onChange={handleInputChange}
                        placeholder="搜索提示词..."
                        className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:text-gray-200 transition-colors"
                        role="searchbox"
                        aria-label="搜索提示词"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {localQuery && (
                        <button
                            onClick={() => {
                                setLocalQuery('');
                                setSearchQuery('');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                            aria-label="清除搜索"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                
                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        showFavoritesOnly
                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}
                    title={showFavoritesOnly ? "显示所有" : "只看收藏"}
                >
                    <svg className="w-4 h-4" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674c.3-.922-.755 1.688-1.538 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>

                <button
                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                        tagFilter || isFiltersExpanded
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    title="高级标签筛选"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </button>
            </div>
            
            {/* 紧凑的横向分类滚动栏 */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                <button
                    onClick={() => setCategoryFilter(null)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors flex-shrink-0 ${
                        !categoryFilter
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                    全部
                </button>
                {categories.map((category) => (
                    <button
                        key={category.name}
                        onClick={() => setCategoryFilter(category.name)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors flex-shrink-0 ${
                            categoryFilter === category.name
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        {category.name}
                        <span className={`ml-1.5 opacity-70 text-[10px]`}>{category.count}</span>
                    </button>
                ))}
            </div>

            {/* 标签过滤状态栏 */}
            {(tagFilter) && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-xs text-gray-400">已选标签:</span>
                    {tagFilter && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md text-[11px]">
                            <span>{tagFilter}</span>
                            <button onClick={() => setTagFilter(null)} className="hover:text-green-800 dark:hover:text-green-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}
                    {tagFilter && (
                        <button onClick={clearFilters} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto">
                            清空标签
                        </button>
                    )}
                </div>
            )}
            
            {/* 展开的标签云 */}
            {isFiltersExpanded && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        所有标签
                    </h4>
                    <TagCloud />
                </div>
            )}
        </div>
    );
};
