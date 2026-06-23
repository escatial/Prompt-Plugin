import { useState } from 'react';
import { usePromptStore } from '../store';

export const TagCloud = () => {
    const { getAllTags, tagFilter, setTagFilter } = usePromptStore();
    const [isExpanded, setIsExpanded] = useState(true);
    const tags = getAllTags();
    
    const visibleTags = isExpanded ? tags : tags.slice(0, 20);

    return (
        <div className="space-y-2" role="region" aria-label="标签筛选">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                aria-expanded={isExpanded}
                aria-controls="tag-list"
            >
                <span>标签筛选</span>
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
                <div id="tag-list" className="space-y-2">
                    <button
                        onClick={() => setTagFilter(null)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            !tagFilter
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        role="option"
                        aria-selected={!tagFilter}
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setTagFilter(null);
                            }
                        }}
                    >
                        全部标签
                    </button>
                    
                    <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="可用标签">
                        {visibleTags.map((tag) => (
                            <button
                                key={tag.name}
                                onClick={() => setTagFilter(tag.name)}
                                className={`px-2 py-1 rounded-full text-xs transition-colors ${
                                    tagFilter === tag.name
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                role="option"
                                aria-selected={tagFilter === tag.name}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setTagFilter(tag.name);
                                    }
                                }}
                            >
                                {tag.name} ({tag.count})
                            </button>
                        ))}
                    </div>
                    
                    {tags.length > 20 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                            aria-label={isExpanded ? '收起标签列表' : '展开所有标签'}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsExpanded(!isExpanded);
                                }
                            }}
                        >
                            {isExpanded ? '收起' : '显示全部'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
