import { useState } from 'react';
import { Prompt } from '../store/types';

interface PromptDetailProps {
    prompt: Prompt;
    onApply: (text: string, onSuccess: () => void) => void;
    onEdit: (prompt: Prompt) => void;
    onDelete: (prompt: Prompt) => void;
    onToggleFavorite: (id: string) => void;
    onClose: () => void;
    isDark: boolean;
}

export const PromptDetail = ({ prompt, onApply, onClose, isDark }: PromptDetailProps) => {
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = () => {
        setIsApplying(true);
        onApply(prompt.content, () => {
            setTimeout(() => setIsApplying(false), 1500);
        });
    };

    return (
        <div 
            className={`absolute inset-x-0 bottom-0 top-12 flex flex-col z-50 rounded-t-3xl overflow-hidden shadow-[0_-15px_40px_rgba(0,0,0,0.2)] ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`flex justify-between items-center px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50/80'}`}>
                <h2 className={`text-lg font-bold truncate pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{prompt.title}</h2>
                <button onClick={onClose} className={`p-2 rounded-full transition-colors flex-shrink-0 ${isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`} title="关闭详情">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="flex flex-wrap gap-2 mb-5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{prompt.category}</span>
                    {prompt.tags.map(tag => (
                        <span key={tag} className={`px-2.5 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                    ))}
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed select-text font-mono">
                        {prompt.content}
                    </p>
                </div>
            </div>

            <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
                <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all transform active:scale-[0.98] ${
                        isApplying
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                    }`}
                >
                    {isApplying ? (
                        <><svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>已成功应用</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>应用到文本框</>
                    )}
                </button>
            </div>
        </div>
    );
};