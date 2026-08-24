// 表达力复盘教练 - 核心类型定义

// 对话消息角色
export type MessageRole = 'user' | 'assistant';

// 对话消息
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

// 场景难度
export type Difficulty = 'normal' | 'high-pressure';

// 场景来源
export type SceneSource = 'preset' | 'custom';

// 训练场景
export interface TrainingScene {
  id: string;
  source: SceneSource;
  name: string;
  myRole: string;
  opponentRole: string;
  background: string;
  goal: string;
  difficulty: Difficulty;
}

// 复盘五大评分维度 (0-10)
export interface ReviewScores {
  logic: number; // 逻辑严谨度
  persuasion: number; // 说服力
  fluency: number; // 流利度
  aura: number; // 气场 & 决断力
  clarity: number; // 观点清晰度
}

// 原话定位问题项
export interface ProblemItem {
  originalQuote: string; // 原话片段
  problemType: string; // 问题定性
  cause: string; // 问题产生原因
  optimization: string; // 优化指导
}

// 复盘报告
export interface ReviewReport {
  scores: ReviewScores;
  problems: ProblemItem[];
  rewrite: string; // 强者示范改写
  frequentIssues: string[]; // 高频问题汇总
  summary: string; // 总体评价
}

// 训练任务类型
export type TrainingTaskType =
  | 'rewrite-practice' // 重述改写练习
  | 'logic-prep' // PREP 逻辑框架练习
  | 'remove-hedge'; // 去除模糊措辞练习

// 训练任务
export interface TrainingTask {
  id: string;
  type: TrainingTaskType;
  title: string;
  description: string;
  prompt: string; // 练习题目/原句
  userAnswer?: string; // 用户作答
  feedback?: string; // AI 点评
  completed: boolean;
}

// 个人弱点标签
export interface WeaknessTag {
  tag: string;
  count: number;
  lastSeen: number;
}

// 大模型 API 配置
export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// 训练会话
export interface TrainingSession {
  id: string;
  scene: TrainingScene;
  messages: ChatMessage[];
  report: ReviewReport | null;
  tasks: TrainingTask[];
  createdAt: number;
  updatedAt: number;
}

// 应用导航视图
export type AppView =
  | 'home'
  | 'training'
  | 'review'
  | 'tasks'
  | 'history'
  | 'weakness'
  | 'settings';
