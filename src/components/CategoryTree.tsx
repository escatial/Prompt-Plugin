import { useState } from 'react';
import { usePromptStore } from '../store';

export const CategoryTree = () => {
    const { getAllCategories, categoryFilter, setCategoryFilter } = usePromptStore();
    const [isExpanded, setIsExpanded] = useState(true);
    const categories = getAllCategories();

    return (
        <div className="space-y-2" role="region" aria-label="分类筛选">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                aria-expanded={isExpanded}
                aria-controls="category-list"
            >
                <span>分类筛选</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            
            {isExpanded && (
                <div id="category-list" className="space-y-1" role="listbox" aria-label="可用分类">
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            !categoryFilter
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        role="option"
                        aria-selected={!categoryFilter}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setCategoryFilter(null);
                            }
                        }}
                    >
                        <span className="flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            全部分类
                        </span>
                        <span className="text-gray-400">
                            {categories.reduce((sum, cat) => sum + cat.count, 0)}
                        </span>
                    </button>
                    
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() => setCategoryFilter(category.name)}
                            className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                categoryFilter === category.name
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            role="option"
                            aria-selected={categoryFilter === category.name}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCategoryFilter(category.name);
                                }
                            }}
                        >
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                {category.name}
                            </span>
                            <span className="text-gray-400">{category.count}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
