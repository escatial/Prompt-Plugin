import { useState, useEffect, useRef, useCallback } from 'react';
import { usePromptStore, useSettingsStore } from '../store';
import { SearchInput } from '../components/SearchInput';
import { PromptList } from '../components/PromptList';
import { PromptFormModal } from '../components/PromptFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Prompt, Theme } from '../store/types';

interface SidebarProps {
}

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 500;

const sendToContent = async (payload: any) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    try {
        return await chrome.tabs.sendMessage(tab.id, payload);
    } catch (e) {
        console.error('Failed to send message to content script', e);
    }
};

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

const getTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
};

const Sidebar: React.FC<SidebarProps> = () => {
    const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
    const [isFloating, setIsFloating] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [hasFocusedElement, setHasFocusedElement] = useState<boolean>(false);
    const startXRef = useRef<number>(0);
    const startWidthRef = useRef<number>(0);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [listHeight, setListHeight] = useState<number>(400);
    
    const [showVariableModal, setShowVariableModal] = useState(false);
    const [currentVariables, setCurrentVariables] = useState<string[]>([]);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const [pendingText, setPendingText] = useState<string>('');
    const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
    
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
    
    const { isLoading, error, initialize, getFilteredPrompts, addPrompt, updatePrompt, deletePrompt } = usePromptStore();
    const { settings, initialize: initializeSettings, updateSettings } = useSettingsStore();
    
    const filteredPrompts = getFilteredPrompts();
    const effectiveTheme = getTheme(settings.theme);
    
    useEffect(() => {
        const loadSettings = async () => {
            const result = await chrome.storage.local.get(['sidebarWidth', 'isFloating']);
            if (typeof result.sidebarWidth === 'number') {
                setWidth(Math.min(Math.max(result.sidebarWidth, MIN_WIDTH), MAX_WIDTH));
            }
            if (typeof result.isFloating === 'boolean') {
                setIsFloating(result.isFloating);
            }
        };
        loadSettings();
        initialize();
        initializeSettings();
    }, [initialize, initializeSettings]);
    
    useEffect(() => {
        setIsFloating(settings.sidebarBehavior === 'floating');
    }, [settings.sidebarBehavior]);
    
    useEffect(() => {
        chrome.storage.local.set({ sidebarWidth: width, isFloating });
    }, [width, isFloating]);
    
    useEffect(() => {
        const checkFocusedElement = async () => {
            const response = await sendToContent({ type: 'GET_LAST_FOCUSED' });
            if (response) {
                setHasFocusedElement(response.hasFocused);
            }
        };
        checkFocusedElement();
    }, []);
    
    useEffect(() => {
        const updateHeight = () => {
            if (listContainerRef.current) {
                const container = listContainerRef.current;
                const rect = container.getBoundingClientRect();
                setListHeight(Math.max(100, rect.height));
            }
        };
        
        updateHeight();
        
        const resizeObserver = new ResizeObserver(updateHeight);
        if (listContainerRef.current) {
            resizeObserver.observe(listContainerRef.current);
        }
        
        return () => resizeObserver.disconnect();
    }, []);
    
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startXRef.current = e.clientX;
        startWidthRef.current = width;
    };
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const diff = startXRef.current - e.clientX;
            const newWidth = startWidthRef.current + diff;
            const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
            setWidth(clampedWidth);
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
        };
        
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);
    
    const processPromptText = (text: string, values: Record<string, string>) => {
        return text.replace(VARIABLE_PATTERN, (_, key) => values[key] || '');
    };
    
    const applyPrompt = async (text: string) => {
        await sendToContent({ type: 'FILL_TEXT', text });
    };
    
    const handleApplyPrompt = useCallback(async (text: string, onSuccess: () => void) => {
        const matches = Array.from(text.matchAll(VARIABLE_PATTERN));
        const variables = [...new Set(matches.map(match => match[1]))];
        
        if (variables.length > 0) {
            setPendingText(text);
            setPendingCallback(() => onSuccess);
            setCurrentVariables(variables);
            setVariableValues({});
            setShowVariableModal(true);
        } else {
            await applyPrompt(text);
            onSuccess();
        }
    }, []);
    
    const handleVariableModalConfirm = async () => {
        const finalText = processPromptText(pendingText, variableValues);
        await applyPrompt(finalText);
        if (pendingCallback) {
            pendingCallback();
        }
        setShowVariableModal(false);
        setPendingText('');
        setPendingCallback(null);
    };
    
    const handleVariableModalCancel = () => {
        setShowVariableModal(false);
        setPendingText('');
        setPendingCallback(null);
    };
    
    const handleCreatePrompt = () => {
        setEditingPrompt(null);
        setShowFormModal(true);
    };
    
    const handleEditPrompt = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setShowFormModal(true);
    };
    
    const handleFormSubmit = (promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingPrompt) {
            updatePrompt(editingPrompt.id, promptData);
        } else {
            addPrompt(promptData);
        }
        setShowFormModal(false);
        setEditingPrompt(null);
    };
    
    const handleFormClose = () => {
        setShowFormModal(false);
        setEditingPrompt(null);
    };
    
    const handleDeletePrompt = (prompt: Prompt) => {
        setPromptToDelete(prompt);
        setShowDeleteModal(true);
    };
    
    const handleDeleteConfirm = () => {
        if (promptToDelete) {
            deletePrompt(promptToDelete.id);
        }
        setShowDeleteModal(false);
        setPromptToDelete(null);
    };
    
    const handleDeleteClose = () => {
        setShowDeleteModal(false);
        setPromptToDelete(null);
    };
    
    const handleToggleFloating = () => {
        const newBehavior = settings.sidebarBehavior === 'fixed' ? 'floating' : 'fixed';
        updateSettings({ sidebarBehavior: newBehavior });
    };
    
    const isDark = effectiveTheme === 'dark';
    
    return (
        <div
            role="application"
            aria-label="Prompt 侧边栏"
            className={`h-screen flex flex-col shadow-xl ${isFloating ? 'fixed top-0 right-0 z-[9999]' : ''} ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
            style={{ width: `${width}px` }}
        >
            <header className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center" aria-hidden="true">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Prompt Sidebar</h1>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} aria-live="polite" aria-atomic="true">
                            {filteredPrompts.length} 个提示词
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => chrome.runtime.openOptionsPage()}
                        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="设置"
                        aria-label="打开设置页面"
                        tabIndex={0}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleCreatePrompt}
                        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="新建提示词"
                        aria-label="新建提示词"
                        tabIndex={0}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button
                        onClick={handleToggleFloating}
                        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                        title={isFloating ? '固定模式' : '悬浮模式'}
                        aria-label={isFloating ? '切换到固定模式' : '切换到悬浮模式'}
                        aria-pressed={isFloating}
                        tabIndex={0}
                    >
                        {isFloating ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 6l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>
                </div>
            </header>
            
            <section className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} aria-label="搜索和筛选">
                <SearchInput />
            </section>
            
            <main className="flex-1 overflow-hidden p-2 flex flex-col relative" ref={listContainerRef} role="main" aria-label="提示词列表">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full" role="status" aria-live="polite" aria-busy="true">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true"></div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载提示词...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center" role="alert" aria-live="assertive">
                        <svg className="w-12 h-12 mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-hidden">
                            <PromptList
                                prompts={filteredPrompts}
                                height={listHeight}
                                onApply={handleApplyPrompt}
                                onEdit={handleEditPrompt}
                                onDelete={handleDeletePrompt}
                            />
                        </div>
                    </>
                )}
            </main>
            
            <footer className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                        hasFocusedElement
                            ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-700'
                            : isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                    }`}
                    role="status"
                    aria-live="polite"
                >
                    {hasFocusedElement ? (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                    <span className="font-medium">{hasFocusedElement ? '已连接到文本框' : '请先点击页面上的文本框'}</span>
                </div>
            </footer>
            
            <div
                className={`absolute top-0 bottom-0 w-1 cursor-ew-resize transition-colors ${isDragging ? 'bg-blue-500' : `bg-transparent ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}`}
                style={{ left: 0 }}
                onMouseDown={handleMouseDown}
                role="separator"
                aria-orientation="vertical"
                aria-label="调整侧边栏宽度"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const step = e.key === 'ArrowLeft' ? -10 : 10;
                        const newWidth = Math.min(Math.max(width + step, MIN_WIDTH), MAX_WIDTH);
                        setWidth(newWidth);
                    }
                }}
            />
            
            {showVariableModal && (
                <div 
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="variable-modal-title"
                >
                    <div className={`rounded-xl p-6 m-4 shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 id="variable-modal-title" className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            填充变量
                        </h3>
                        <div className="space-y-4">
                            {currentVariables.map((variable) => (
                                <div key={variable}>
                                    <label 
                                        htmlFor={`variable-${variable}`}
                                        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        {variable}
                                    </label>
                                    <input
                                        id={`variable-${variable}`}
                                        type="text"
                                        value={variableValues[variable] || ''}
                                        onChange={(e) => setVariableValues(prev => ({
                                            ...prev,
                                            [variable]: e.target.value
                                        }))}
                                        className={`w-full px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
                                            isDark 
                                                ? 'border border-gray-600 bg-gray-700 text-white focus:border-blue-500' 
                                                : 'border border-gray-300 focus:border-blue-500'
                                        }`}
                                        placeholder={`请输入 ${variable}`}
                                        autoFocus
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleVariableModalCancel}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                                    isDark 
                                        ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleVariableModalConfirm}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <PromptFormModal
                isOpen={showFormModal}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
                editingPrompt={editingPrompt}
            />
            
            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={handleDeleteClose}
                onConfirm={handleDeleteConfirm}
                title={promptToDelete?.title || ''}
            />
        </div>
    );
};

export default Sidebar;
