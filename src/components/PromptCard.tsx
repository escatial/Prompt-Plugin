import { useState } from 'react';
import { Prompt } from '../store/types';
import { usePromptStore } from '../store';

interface PromptCardProps {
    prompt: Prompt;
    onApply: (text: string, onSuccess: () => void) => void;
    onEdit: (prompt: Prompt) => void;
    onDelete: (prompt: Prompt) => void;
    isFocused?: boolean;
    onFocus?: () => void;
    index?: number;
}

export const PromptCard = ({ 
    prompt, 
    onApply, 
    onEdit, 
    onDelete, 
    isFocused = false, 
    onFocus,
    index
}: PromptCardProps) => {
    const { toggleFavorite, selectedPromptId, setSelectedPromptId } = usePromptStore();
    const isSelected = selectedPromptId === prompt.id;
    const [isApplying, setIsApplying] = useState(false);
    
    const handleFavoriteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        toggleFavorite(prompt.id);
    };
    
    const handleApplyClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setIsApplying(true);
        onApply(prompt.content, () => {
            setTimeout(() => {
                setIsApplying(false);
            }, 1500);
        });
    };
    
    const handleEditClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onEdit(prompt);
    };
    
    const handleDeleteClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        onDelete(prompt);
    };

    const handleCardClick = () => {
        // Toggle selection: if clicking the already selected card, deselect it.
        setSelectedPromptId(isSelected ? null : prompt.id);
        onFocus?.();
    };

    return (
        <div
            onClick={handleCardClick}
            onFocus={onFocus}
            tabIndex={isFocused ? 0 : -1}
            role="option"
            aria-selected={isSelected}
            aria-posinset={index !== undefined ? index + 1 : undefined}
            aria-setsize={undefined}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10' 
                    : isFocused
                    ? 'ring-2 ring-blue-300 dark:ring-blue-700 bg-white dark:bg-gray-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
            }`}
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <h3 className={`font-bold text-[15px] ${isSelected ? 'whitespace-normal' : 'truncate'} text-gray-900 dark:text-gray-100`}>
                                {prompt.title}
                            </h3>
                            {prompt.isFavorite && (
                                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674c.3-.922-.755 1.688-1.538 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            )}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleFavoriteClick}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                            prompt.isFavorite
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                        title={prompt.isFavorite ? '取消收藏' : '收藏'}
                    >
                        <svg className="w-4 h-4" fill={prompt.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674c.3-.922-.755 1.688-1.538 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>

                <div className={`text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 ${isSelected ? 'whitespace-pre-wrap select-text' : 'line-clamp-3'}`}>
                    {prompt.content}
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0 pr-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
                            {prompt.category}
                        </span>
                        {prompt.tags.slice(0, isSelected ? undefined : 2).map((tag, i) => (
                            <span
                                key={i}
                                className={`px-2 py-0.5 rounded-md text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent dark:border-gray-700`}
                            >
                                {tag}
                            </span>
                        ))}
                        {!isSelected && prompt.tags.length > 2 && (
                            <span className={`px-2 py-0.5 rounded-md text-[11px] text-gray-400 dark:text-gray-500`}>
                                +{prompt.tags.length - 2}
                            </span>
                        )}
                    </div>
                    
                    {isSelected && (
                        <div className="flex items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                                onClick={handleEditClick}
                                className={`p-2 rounded-lg transition-colors bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200`}
                                title="编辑"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button
                                onClick={handleDeleteClick}
                                className={`p-2 rounded-lg transition-colors bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40`}
                                title="删除"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            <button
                                onClick={handleApplyClick}
                                disabled={isApplying}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all transform active:scale-[0.98] ${
                                    isApplying
                                        ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                                        : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                                }`}
                                title="应用提示词"
                            >
                                {isApplying ? (
                                    <><svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>已应用</>
                                ) : (
                                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>应用</>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {!isSelected && (
                        <button
                            onClick={handleApplyClick}
                            disabled={isApplying}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                                isApplying
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                            }`}
                            title="应用提示词"
                        >
                            {isApplying ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
