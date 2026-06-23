import { Virtuoso } from 'react-virtuoso';
import { Prompt } from '../store/types';
import { PromptCard } from './PromptCard';
import { useCallback, useEffect, useRef } from 'react';
import { usePromptStore } from '../store';

interface PromptListProps {
    prompts: Prompt[];
    onApply: (text: string, onSuccess: () => void) => void;
    onEdit: (prompt: Prompt) => void;
    onDelete: (prompt: Prompt) => void;
    height: number;
}

export const PromptList = ({ prompts, onApply, onEdit, onDelete }: PromptListProps) => {
    const { selectedPromptId, setSelectedPromptId, focusedPromptIndex, setFocusedPromptIndex } = usePromptStore();
    const virtuosoRef = useRef<any>(null);
    const focusedIndex = focusedPromptIndex || 0;
    const setFocusedIndex = setFocusedPromptIndex;

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (prompts.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(Math.min(focusedIndex + 1, prompts.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(Math.max(focusedIndex - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (prompts[focusedIndex]) {
                    setSelectedPromptId(prompts[focusedIndex].id === selectedPromptId 
                        ? null 
                        : prompts[focusedIndex].id
                    );
                }
                break;
            case ' ':
                e.preventDefault();
                if (prompts[focusedIndex]) {
                    onApply(prompts[focusedIndex].content, () => {});
                }
                break;
            default:
                break;
        }
    }, [prompts, focusedIndex, setFocusedIndex, selectedPromptId, setSelectedPromptId, onApply]);

    useEffect(() => {
        if (virtuosoRef.current && focusedIndex >= 0 && focusedIndex < prompts.length) {
            virtuosoRef.current.scrollToIndex({ index: focusedIndex, align: 'center', behavior: 'smooth' });
        }
    }, [focusedIndex, prompts.length]);

    useEffect(() => {
        if (focusedIndex >= prompts.length) {
            setFocusedIndex(Math.max(0, prompts.length - 1));
        }
    }, [prompts.length, focusedIndex, setFocusedIndex]);

    if (prompts.length === 0) {
        return (
            <div 
                className="flex flex-col items-center justify-center h-full text-gray-500"
                role="status"
                aria-live="polite"
            >
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">没有找到匹配的提示词</p>
            </div>
        );
    }

    return (
        <div onKeyDown={handleKeyDown} tabIndex={0} role="listbox" aria-label="提示词列表" className="h-full w-full">
            <Virtuoso
                ref={virtuosoRef}
                className="h-full w-full custom-scrollbar"
                data={prompts}
                itemContent={(index, prompt) => (
                    <div className="px-2 py-2">
                        <PromptCard 
                            prompt={prompt} 
                            onApply={onApply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            isFocused={focusedIndex === index}
                            onFocus={() => setFocusedIndex(index)}
                            index={index}
                        />
                    </div>
                )}
            />
            <div className="sr-only" aria-live="polite">
                共 {prompts.length} 个提示词，当前聚焦第 {focusedIndex + 1} 个
            </div>
        </div>
    );
};
