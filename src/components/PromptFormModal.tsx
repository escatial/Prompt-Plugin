import { useState, useEffect } from 'react';
import { Prompt } from '../store/types';

interface PromptFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
    editingPrompt?: Prompt | null;
}

export const PromptFormModal = ({ isOpen, onClose, onSubmit, editingPrompt }: PromptFormModalProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [tags, setTags] = useState('');

    useEffect(() => {
        if (editingPrompt) {
            setTitle(editingPrompt.title);
            setContent(editingPrompt.content);
            setCategory(editingPrompt.category);
            setTags(editingPrompt.tags.join(', '));
        } else {
            setTitle('');
            setContent('');
            setCategory('');
            setTags('');
        }
    }, [editingPrompt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const processedTags = tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
        
        onSubmit({
            title: title.trim(),
            content: content.trim(),
            category: category.trim(),
            tags: processedTags,
            isFavorite: editingPrompt ? editingPrompt.isFavorite : false,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {editingPrompt ? '编辑提示词' : '新建提示词'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            标题 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="输入提示词标题"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            内容 *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            rows={6}
                            placeholder="输入提示词内容，使用 {{variable}} 定义变量"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            分类
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="如：写作、编程、翻译"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            标签（用逗号分隔）
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="如：GPT-4, 代码生成, 中文"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {editingPrompt ? '保存修改' : '创建提示词'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
