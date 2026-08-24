import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { RadarChart } from '../components/RadarChart';
import {
  REVIEW_SYSTEM_PROMPT,
  buildReviewUserPrompt,
  TASKS_SYSTEM_PROMPT,
  buildTasksUserPrompt,
} from '../llm/prompts';
import { reviewDiagnosis, generateTasks, extractJson } from '../llm/client';
import type { ProblemItem, ReviewReport, TrainingTask } from '../types';

export function ReviewPage() {
  const {
    currentSession,
    setCurrentSession,
    apiConfig,
    addWeaknesses,
    setView,
  } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'done'>(
    currentSession?.report ? 'done' : 'loading',
  );

  const runReview = useCallback(async () => {
    if (!currentSession) return;
    if (!apiConfig.apiKey) {
      setError('请先在「设置」中配置大模型 API 密钥');
      setPhase('done');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userPrompt = buildReviewUserPrompt(currentSession.messages);
      const raw = await reviewDiagnosis(
        apiConfig,
        REVIEW_SYSTEM_PROMPT,
        userPrompt,
      );
      const report = extractJson<ReviewReport>(raw);
      // 校验并补全
      const safe: ReviewReport = {
        scores: {
          logic: clamp(report.scores?.logic),
          persuasion: clamp(report.scores?.persuasion),
          fluency: clamp(report.scores?.fluency),
          aura: clamp(report.scores?.aura),
          clarity: clamp(report.scores?.clarity),
        },
        problems: Array.isArray(report.problems)
          ? report.problems.map(normalizeProblem)
          : [],
        rewrite: report.rewrite || '（无改写示范）',
        frequentIssues: Array.isArray(report.frequentIssues)
          ? report.frequentIssues
          : [],
        summary: report.summary || '',
      };

      // 提取弱点标签存档
      const weaknessTags = [
        ...safe.frequentIssues,
        ...safe.problems.map((p) => p.problemType),
      ].filter(Boolean);
      if (weaknessTags.length > 0) {
        addWeaknesses(weaknessTags);
      }

      // 生成训练任务
      let tasks: TrainingTask[] = [];
      try {
        const taskRaw = await generateTasks(
          apiConfig,
          TASKS_SYSTEM_PROMPT,
          buildTasksUserPrompt(safe),
        );
        const parsed = extractJson<
          Array<{
            type: TrainingTask['type'];
            title: string;
            description: string;
            prompt: string;
          }>
        >(taskRaw);
        if (Array.isArray(parsed)) {
          tasks = parsed.map((t, i) => ({
            id: `task_${Date.now()}_${i}`,
            type: t.type,
            title: t.title,
            description: t.description,
            prompt: t.prompt,
            completed: false,
          }));
        }
      } catch {
        // 任务生成失败不阻断复盘展示
        tasks = [];
      }

      setCurrentSession({
        ...currentSession,
        report: safe,
        tasks,
      });
      setPhase('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`复盘失败：${msg}`);
      setPhase('done');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession, apiConfig]);

  useEffect(() => {
    if (currentSession && !currentSession.report && phase === 'loading') {
      runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentSession) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="emoji">📋</div>
          <div>没有进行中的训练会话</div>
          <button
            className="btn btn-primary mt-md"
            style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}
            onClick={() => setView('training')}
          >
            去训练
          </button>
        </div>
      </div>
    );
  }

  const report = currentSession.report;

  if (loading || (phase === 'loading' && !report)) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="spinner spinner-dark" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 600 }}>复盘诊断进行中...</div>
          <div className="muted text-sm mt-sm">
            正在分析你的逻辑、说服力、流利度、气场与观点清晰度
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="emoji">⚠️</div>
          <div>{error}</div>
          <button className="btn btn-primary mt-md" onClick={runReview}>
            重新复盘
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const avgScore =
    Math.round(
      ((report.scores.logic +
        report.scores.persuasion +
        report.scores.fluency +
        report.scores.aura +
        report.scores.clarity) /
        5) *
        10,
    ) / 10;

  return (
    <div className="page">
      <h1 className="page-title">复盘报告</h1>

      {error && (
        <div
          className="card mb-md"
          style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {/* 雷达图 + 总分 */}
      <div className="card mb-md">
        <div className="row between center mb-md">
          <span style={{ fontWeight: 700 }}>能力雷达</span>
          <span className="tag" style={{ fontSize: 14 }}>
            均分 {avgScore}
          </span>
        </div>
        <RadarChart scores={report.scores} />
        {report.summary && (
          <div
            className="mt-sm"
            style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.7 }}
          >
            {report.summary}
          </div>
        )}
      </div>

      {/* 原话定位问题 */}
      <div className="card mb-md">
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          原话定位问题
        </div>
        {report.problems.length === 0 ? (
          <div className="muted text-sm">未发现明显问题</div>
        ) : (
          <div className="col gap-sm">
            {report.problems.map((p, i) => (
              <ProblemCard key={i} index={i} problem={p} />
            ))}
          </div>
        )}
      </div>

      {/* 强者示范改写 */}
      <div className="card mb-md">
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          强者示范改写
        </div>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            color: '#14532d',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {report.rewrite}
        </div>
      </div>

      {/* 高频问题汇总 */}
      {report.frequentIssues.length > 0 && (
        <div className="card mb-md">
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
            高频问题汇总
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {report.frequentIssues.map((iss, i) => (
              <span
                key={i}
                className="tag"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                {iss}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => setView('tasks')}
      >
        进入专项训练任务
      </button>

      <button
        className="btn btn-ghost mt-sm"
        onClick={() => setView('home')}
      >
        返回首页
      </button>
    </div>
  );
}

function ProblemCard({ index, problem }: { index: number; problem: ProblemItem }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-sm) var(--space-md)',
      }}
    >
      <div className="row center gap-sm mb-md">
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        <span className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>
          {problem.problemType}
        </span>
      </div>
      <div
        style={{
          borderLeft: '3px solid #cbd5e1',
          paddingLeft: 10,
          marginBottom: 8,
          color: 'var(--color-text)',
          fontStyle: 'italic',
        }}
      >
        「{problem.originalQuote}」
      </div>
      <div className="text-sm" style={{ color: 'var(--color-text)' }}>
        <span className="muted">原因：</span>
        {problem.cause}
      </div>
      <div className="text-sm mt-sm" style={{ color: 'var(--color-text)' }}>
        <span style={{ color: '#2563eb', fontWeight: 600 }}>优化指导：</span>
        {problem.optimization}
      </div>
    </div>
  );
}

function clamp(n: unknown): number {
  const num = Number(n);
  if (Number.isNaN(num)) return 5;
  return Math.max(0, Math.min(10, Math.round(num)));
}

function normalizeProblem(p: Partial<ProblemItem>): ProblemItem {
  return {
    originalQuote: p.originalQuote || '（未引用原话）',
    problemType: p.problemType || '表达问题',
    cause: p.cause || '未分析原因',
    optimization: p.optimization || '未提供优化建议',
  };
}
