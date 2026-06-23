import { Prompt } from './types';

// 工具方法：生成随机ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 预定义标签池，用于随机分配标签（如果需要的话）
const defaultTags = ['学术', '论文', '写作', '研究', '分析', '数据', '方法论'];

// 从 Markdown 文本解析出 Prompt 数组
export const parseMarkdownToPrompts = (markdown: string): Prompt[] => {
    const lines = markdown.split('\n');
    const prompts: Prompt[] = [];
    
    let currentMainCategory = '';
    let currentSubCategory = '';
    let currentContent: string[] = [];
    
    const saveCurrentPrompt = () => {
        if (currentContent.length > 0 && currentSubCategory) {
            // 清理多余空行和 markdown 粗体标记
            let content = currentContent.join('\n').trim();
            // 去除最外层的粗体标记 **，但保留内部格式
            if (content.startsWith('**') && content.endsWith('**')) {
                content = content.substring(2, content.length - 2).trim();
            }
            
            if (content) {
                // 生成1-3个随机标签
                const tags = [...defaultTags]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, Math.floor(Math.random() * 3) + 1);
                    
                prompts.push({
                    id: generateId(),
                    title: currentSubCategory,
                    content: content,
                    category: currentMainCategory || '未分类',
                    tags: tags,
                    isFavorite: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        currentContent = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('# ')) {
            // 一级标题：大分类
            saveCurrentPrompt();
            currentMainCategory = line.substring(2).trim();
            currentSubCategory = '';
        } else if (line.startsWith('## ')) {
            // 二级标题：子分类/标题
            saveCurrentPrompt();
            currentSubCategory = line.substring(3).trim();
        } else if (line.startsWith('### ')) {
            // 三级标题：也是作为子分类/标题（如 摘要 下的 常规、实证）
            saveCurrentPrompt();
            currentSubCategory = line.substring(4).trim();
        } else if (line !== '') {
            // 内容行
            // 如果遇到没有分类直接写内容的，用默认分类
            if (!currentMainCategory) currentMainCategory = '通用';
            if (!currentSubCategory) currentSubCategory = '未命名提示词';
            
            currentContent.push(line);
        }
    }
    
    // 保存最后一个
    saveCurrentPrompt();
    
    return prompts;
};
