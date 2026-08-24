import type { TrainingScene } from '../types';

// 预设场景库（面向职场管理、领导力沟通）
export const PRESET_SCENES: Omit<TrainingScene, 'id' | 'difficulty'>[] = [
  {
    source: 'preset',
    name: '团队任务布置',
    myRole: '部门负责人',
    opponentRole: '下属（项目执行人）',
    background:
      '本周需要推进一个重要项目，时间紧、要求高，你需要向下属布置任务，明确目标与节点，同时调动积极性。',
    goal: '清晰传达任务目标、标准与截止时间，让对方理解优先级并主动承担责任。',
  },
  {
    source: 'preset',
    name: '向下沟通（绩效反馈）',
    myRole: '直属主管',
    opponentRole: '绩效未达预期的下属',
    background:
      '下属近期工作表现下滑，多次交付不达标。你需要进行一次绩效反馈谈话，指出问题并达成改进共识。',
    goal: '客观指出问题，避免激化对抗，引导对方认同改进方向并给出具体承诺。',
  },
  {
    source: 'preset',
    name: '向上汇报',
    myRole: '中层管理者',
    opponentRole: '上级领导',
    background:
      '你负责的项目遇到资源瓶颈，需要向上级汇报进展并争取追加预算与人力支持。',
    goal: '用结构化方式汇报现状、风险与方案，说服上级给予资源支持。',
  },
  {
    source: 'preset',
    name: '商务说服谈判',
    myRole: '业务方负责人',
    opponentRole: '合作方决策人',
    background:
      '与合作方就一项关键合作条款进行谈判，对方压价并提出苛刻交付要求，你需要争取有利条件。',
    goal: '守住核心利益底线，灵活交换条件，推动合作达成。',
  },
  {
    source: 'preset',
    name: '冲突沟通',
    myRole: '团队负责人',
    opponentRole: '情绪激动的同事/下属',
    background:
      '两名团队成员因职责边界产生冲突，其中一方情绪激动地找到你，需要你平复情绪并给出解决方案。',
    goal: '先共情降温，再引导回归事实，给出清晰的责任划分与后续安排。',
  },
  {
    source: 'preset',
    name: '即兴公开发言',
    myRole: '被临时点名发言的管理者',
    opponentRole: '现场听众/主持人追问',
    background:
      '在一次公司全员会上，主持人临时点名你分享对某项战略的看法，随后会有尖锐追问。',
    goal: '短时间内组织有逻辑、有观点、有力量的发言，并从容应对追问。',
  },
];
