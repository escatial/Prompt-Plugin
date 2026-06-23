# Prompt Sidebar - 实施计划（分解并优先级排序的任务列表）

## [ ] 任务 1: 项目初始化与基础架构搭建
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 初始化 Chrome 扩展项目结构（Manifest V3）
  - 配置 React + TypeScript + Tailwind CSS 开发环境
  - 搭建目录结构：src/（content-script、sidepanel、background、popup、options）
  - 配置构建工具（Vite/Webpack）和开发流程
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 项目能成功构建并在浏览器中加载扩展
  - `human-judgement` TR-1.2: 目录结构清晰，符合浏览器扩展开发规范
- **Notes**: 使用 Vite + CRXJS 作为构建工具，便于热更新开发
- **Estimated Effort**: 8 小时
- **Roles**: 开发（全栈）

## [ ] 任务 2: 侧边栏容器基础实现
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 使用 Chrome sidePanel API 实现基础侧边栏
  - 实现固定/悬浮模式切换
  - 实现侧边栏宽度拖拽调整（280px-500px）
  - 基础 UI 布局框架
- **Acceptance Criteria Addressed**: AC-1, AC-10
- **Test Requirements**:
  - `programmatic` TR-2.1: 点击扩展图标能正确打开/关闭侧边栏
  - `programmatic` TR-2.2: 侧边栏宽度能在 280px-500px 之间调整
  - `human-judgement` TR-2.3: 固定/悬浮模式切换正常，布局不变形
- **Notes**:
- **Estimated Effort**: 12 小时
- **Roles**: 开发（前端）

## [ ] 任务 3: Content Script 文本框识别
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 注入 content script 监听页面 focus 事件
  - 识别可编辑元素（input、textarea、contenteditable）
  - 记录最后聚焦的文本框引用（包括 Shadow DOM 内）
  - 实现与 sidePanel 的通信机制
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-3.1: 能正确识别并记录各种类型的文本输入框
  - `programmatic` TR-3.2: 支持 Shadow DOM 内的输入框识别
  - `human-judgement` TR-3.3: 在 ChatGPT、Claude、Notion 等网站测试识别正常
- **Notes**:
- **Estimated Effort**: 16 小时
- **Roles**: 开发（前端）

## [ ] 任务 4: 提示词数据结构与存储
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 设计提示词数据结构（标题、内容、分类、标签、收藏、时间戳）
  - 实现 Chrome Storage Local/Sync 存储层
  - 预置示例提示词数据
  - 实现数据 CRUD 基础操作
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 数据能正确写入和读取存储
  - `programmatic` TR-4.2: 刷新浏览器后数据持久化
  - `programmatic` TR-4.3: 示例提示词正确初始化
- **Notes**: 使用 Zustand 管理侧边栏内的状态
- **Estimated Effort**: 10 小时
- **Roles**: 开发（前端）

## [ ] 任务 5: 提示词列表与搜索 UI
- **Priority**: P0
- **Depends On**: 任务 2, 任务 4
- **Description**:
  - 实现提示词卡片列表展示
  - 实现实时搜索功能（搜索标题、内容、标签）
  - 实现虚拟滚动支持 1000+ 条目
  - 基础样式与布局
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-8
- **Test Requirements**:
  - `programmatic` TR-5.1: 搜索能正确过滤提示词
  - `programmatic` TR-5.2: 虚拟滚动在 1000+ 条目下仍流畅
  - `human-judgement` TR-5.3: UI 美观，符合设计规范
- **Notes**:
- **Estimated Effort**: 16 小时
- **Roles**: 开发（前端）+ 设计（UI/UX）

## [ ] 任务 6: 提示词应用与自动填入
- **Priority**: P0
- **Depends On**: 任务 3, 任务 5
- **Description**:
  - 实现"应用"按钮点击事件
  - 实现通过 chrome.runtime.sendMessage 向 content script 发送填充命令
  - 实现 content script 侧的文本框填充逻辑
  - 实现变量占位符 {{input}} 的弹窗替换
  - 实现成功反馈动画
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-6.1: 点击应用能正确填入文本框
  - `programmatic` TR-6.2: 光标定位在内容末尾
  - `programmatic` TR-6.3: 变量占位符能正确弹出输入框并替换
  - `human-judgement` TR-6.4: 成功反馈动画正常
- **Notes**:
- **Estimated Effort**: 20 小时
- **Roles**: 开发（前端）

## [ ] 任务 7: 提示词新建/编辑/删除功能
- **Priority**: P0
- **Depends On**: 任务 4, 任务 5
- **Description**:
  - 实现新建提示词弹窗
  - 实现编辑提示词弹窗
  - 实现删除提示词功能（含确认）
  - 实现收藏/取消收藏功能
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: 新建提示词能正确保存
  - `programmatic` TR-7.2: 编辑提示词能正确更新
  - `programmatic` TR-7.3: 删除提示词能正确移除
  - `programmatic` TR-7.4: 收藏功能正常
- **Notes**:
- **Estimated Effort**: 12 小时
- **Roles**: 开发（前端）

## [ ] 任务 8: 分类与标签筛选
- **Priority**: P1
- **Depends On**: 任务 5
- **Description**:
  - 实现分类树展示
  - 实现标签云/标签筛选
  - 实现收藏标签页
  - 实现筛选状态管理
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-8.1: 分类筛选能正确过滤
  - `programmatic` TR-8.2: 标签筛选能正确过滤
  - `programmatic` TR-8.3: 收藏标签页显示正确
- **Notes**:
- **Estimated Effort**: 10 小时
- **Roles**: 开发（前端）

## [ ] 任务 9: 快捷键与召唤方式
- **Priority**: P1
- **Depends On**: 任务 2
- **Description**:
  - 实现 Alt+Q 快捷键切换侧边栏
  - 实现快捷键自定义（设置页面）
  - 实现悬浮球召唤（可选）
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-9.1: 快捷键能正确切换侧边栏
  - `programmatic` TR-9.2: 自定义快捷键后能立即生效
  - `human-judgement` TR-9.3: 悬浮球交互流畅
- **Notes**:
- **Estimated Effort**: 8 小时
- **Roles**: 开发（前端）

## [ ] 任务 10: 设置页面
- **Priority**: P1
- **Depends On**: 任务 2
- **Description**:
  - 实现设置页面 UI
  - 实现侧边栏行为设置（默认固定/悬浮）
  - 实现主题设置（亮色/暗色/跟随系统）
  - 实现黑名单网站设置
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-10.1: 设置能正确保存
  - `human-judgement` TR-10.2: UI 美观易用
- **Notes**:
- **Estimated Effort**: 8 小时
- **Roles**: 开发（前端）+ 设计（UI/UX）

## [ ] 任务 11: 导入/导出功能
- **Priority**: P1
- **Depends On**: 任务 4
- **Description**:
  - 实现导出为 JSON 文件
  - 实现从 JSON 文件导入
  - 实现导入数据验证
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-11.1: 导出的 JSON 包含所有数据
  - `programmatic` TR-11.2: 导入 JSON 能正确恢复数据
  - `programmatic` TR-11.3: 错误格式有适当提示
- **Notes**:
- **Estimated Effort**: 8 小时
- **Roles**: 开发（前端）

## [ ] 任务 12: 性能优化与测试
- **Priority**: P1
- **Depends On**: 任务 6, 任务 7
- **Description**:
  - 优化搜索性能（索引、防抖）
  - 优化虚拟滚动
  - 压力测试（1000+ 提示词）
  - 兼容性测试（Chrome、Edge、Firefox）
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `programmatic` TR-12.1: 搜索响应 <100ms
  - `programmatic` TR-12.2: 填充延迟 <50ms
  - `human-judgement` TR-12.3: 在主流网站兼容性良好
- **Notes**:
- **Estimated Effort**: 12 小时
- **Roles**: 开发（测试）

## [ ] 任务 13: 可访问性与最终测试
- **Priority**: P1
- **Depends On**: 所有 P0 任务
- **Description**:
  - 实现键盘完全可操作
  - 确保足够对比度
  - 屏幕阅读器支持
  - 完整功能回归测试
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `human-judgement` TR-13.1: 键盘可完成所有操作
  - `human-judgement` TR-13.2: 符合 WCAG 2.1 AA 标准
  - `programmatic` TR-13.3: 所有功能回归测试通过
- **Notes**:
- **Estimated Effort**: 8 小时
- **Roles**: 开发（测试）+ 产品

## 里程碑节点

### 里程碑 1: 核心功能完成（第 1 周结束）
- **交付物**: 可工作的最小可行产品（MVP）
- **包含任务**: 任务 1-7
- **验收标准**: AC-1, AC-2, AC-4, AC-5 全部通过

### 里程碑 2: 增强功能完成（第 10 天）
- **交付物**: 包含所有 P0 和 P1 功能的版本
- **包含任务**: 任务 1-11
- **验收标准**: 所有 P0 和 P1 功能通过

### 里程碑 3: 发布准备（第 2 周结束）
- **交付物**: 可发布的 v1.0 版本
- **包含任务**: 任务 1-13
- **验收标准**: 所有验收标准通过

## 角色权责划分

### 产品经理
- 需求澄清与确认
- 验收标准评审
- 最终功能验收
- 用户反馈收集

### 开发（前端/全栈）
- 代码实现
- 单元测试编写
- 代码质量保证
- 调试与修复

### 设计（UI/UX）
- UI 设计稿
- 交互原型
- 设计规范
- 视觉验收

### 测试
- 兼容性测试
- 性能测试
- 回归测试
- 缺陷报告

## 风险预判与应对

### 风险 1: 部分网站文本框识别困难
- **影响**: 高
- **概率**: 中
- **应对**: 提前测试主流网站，预留降级策略，提供手动选择文本框功能

### 风险 2: Chrome sidePanel API 在某些环境不可用
- **影响**: 中
- **概率**: 低
- **应对**: 实现 popup 模式作为降级方案

### 风险 3: 虚拟滚动实现复杂度超预期
- **影响**: 中
- **概率**: 中
- **应对**: 先实现基础列表，1000+ 条优化可作为后续迭代

### 风险 4: 需求变更导致延期
- **影响**: 中
- **概率**: 中
- **应对**: 严格控制 v1.0 范围，新需求放入 v1.1+ 规划
