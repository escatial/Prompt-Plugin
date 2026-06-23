# Prompt Sidebar - 产品需求文档

## Overview
- **Summary**: Prompt Sidebar 是一款轻量级 Chrome/Edge 浏览器扩展，帮助用户在浏览器右侧以固定侧边栏或可召唤面板的形式集中管理、组织各类提示词（Prompt），并能一键自动填入当前聚焦的文本输入框（如 ChatGPT、Claude、搜索引擎、表单等）。
- **Purpose**: 解决用户频繁复制粘贴提示词、在多个页面间切换管理提示词的痛点，提升文本输入效率和提示词组织能力。
- **Target Users**: 频繁使用 AI 对话工具的内容创作者、开发者、研究者，需要反复使用标准提示词模板的运营、客服、产品人员，以及任何需要提升浏览器文本输入效率的用户。

## Goals
- 提供便捷的侧边栏/弹出面板用于提示词管理
- 实现提示词一键自动填入文本输入框的核心功能
- 支持提示词的分类、搜索、编辑、删除等管理功能
- 实现跨设备同步和数据备份/恢复
- 确保高性能、高兼容性和良好的用户体验

## Non-Goals (Out of Scope)
- 不提供提示词市场功能（v1.1+）
- 不实现 AI 智能生成提示词功能（v1.1+）
- 不支持多语言界面（v1.1+）
- 不提供复杂的变量类型（仅基础 {{input}} 占位符）
- 不与第三方服务集成（除浏览器存储 API）

## Background & Context
- 项目基于 Chrome Manifest V3 开发
- 使用 React + TypeScript + Tailwind CSS 技术栈
- 核心技术挑战在于跨标签页文本框识别和注入
- 优先适配 Chrome 100+、Edge 100+，对 Firefox 做基本适配

## Functional Requirements
- **FR-1**: 侧边栏容器功能（固定/悬浮、宽度可调整、可拖拽）
- **FR-2**: 召唤与隐藏（快捷键、工具栏图标、上下文悬浮球）
- **FR-3**: 提示词管理（新建、编辑、删除、分类、标签、搜索、收藏）
- **FR-4**: 自动填入功能（文本框识别、应用提示词、变量占位符）
- **FR-5**: 同步与备份（Chrome Storage Sync、JSON 导入/导出）
- **FR-6**: 设置页面（侧边栏行为、快捷键、主题等）

## Non-Functional Requirements
- **NFR-1**: 侧边栏打开/搜索响应 <100ms，应用填充延迟 <50ms
- **NFR-2**: 支持 Chrome 100+、Edge 100+，兼容 Firefox（基本适配）
- **NFR-3**: 数据仅存储在用户本地，不向服务器传输，权限最小化
- **NFR-4**: 符合 WCAG 2.1 AA 标准，键盘完全可操作
- **NFR-5**: 虚拟滚动支持 1000+ 提示词条目，滚动流畅
- **NFR-6**: 对各类异常文本框有降级策略，不导致页面崩溃

## Constraints
- **Technical**: 必须使用 Chrome Manifest V3，依赖 sidePanel、storage、scripting、activeTab 权限
- **Business**: v1.0 版本需要在 2 周内完成核心功能开发
- **Dependencies**: 无外部服务依赖，仅使用浏览器内置 API

## Assumptions
- 用户使用 Chrome 或 Edge 浏览器（版本 100+）
- 用户已登录 Chrome 账号以启用同步功能（可选）
- 文本框使用标准的 input/textarea/contenteditable 元素

## Acceptance Criteria

### AC-1: 侧边栏显示与隐藏
- **Given**: 用户已安装扩展
- **When**: 用户点击扩展图标或按快捷键 Alt+Q
- **Then**: 浏览器右侧显示 360px 宽度的侧边栏，再次操作则关闭
- **Verification**: programmatic + human-judgment
- **Notes**: 需要验证快捷键可自定义

### AC-2: 提示词列表展示
- **Given**: 用户已添加提示词数据
- **When**: 用户打开侧边栏
- **Then**: 侧边栏显示提示词列表，包含标题、内容预览、标签
- **Verification**: programmatic + human-judgment

### AC-3: 提示词搜索功能
- **Given**: 用户有多个提示词
- **When**: 用户在搜索栏输入关键词
- **Then**: 列表实时过滤显示匹配的提示词（搜索标题、内容、标签）
- **Verification**: programmatic

### AC-4: 提示词自动填入
- **Given**: 用户在网页上聚焦了一个文本输入框
- **When**: 用户在侧边栏点击提示词的"应用"按钮
- **Then**: 提示词内容自动填入该文本框，光标定位在内容末尾
- **Verification**: programmatic + human-judgment

### AC-5: 提示词管理功能
- **Given**: 用户已安装扩展
- **When**: 用户在侧边栏新建、编辑、删除提示词
- **Then**: 数据立即更新并持久化，刷新浏览器后仍在
- **Verification**: programmatic

### AC-6: 分类与标签功能
- **Given**: 用户有带分类和标签的提示词
- **When**: 用户选择分类或标签筛选
- **Then**: 列表显示对应筛选结果
- **Verification**: programmatic

### AC-7: 数据导入导出
- **Given**: 用户有提示词数据
- **When**: 用户导出 JSON 文件后再导入
- **Then**: 导入后数据完全恢复
- **Verification**: programmatic

### AC-8: 性能要求
- **Given**: 用户有 1000+ 提示词
- **When**: 用户打开侧边栏、搜索、滚动
- **Then**: 操作流畅，无明显卡顿
- **Verification**: programmatic + human-judgment

### AC-9: 兼容性测试
- **Given**: 安装扩展的浏览器
- **When**: 在 ChatGPT、Claude、Notion、搜索引擎等主流网站测试
- **Then**: 提示词自动填入功能正常工作
- **Verification**: human-judgment

### AC-10: 侧边栏调整
- **Given**: 侧边栏已打开
- **When**: 用户拖拽调整宽度或切换固定/悬浮模式
- **Then**: 侧边栏按要求调整，布局不变形
- **Verification**: human-judgment

## Open Questions
- [ ] 是否需要支持变量占位符以外的更多动态内容？
- [ ] Firefox 适配的具体优先级和范围？
- [ ] 是否需要实现右键菜单召唤功能？
