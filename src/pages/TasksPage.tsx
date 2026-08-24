import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import {
  TASK_FEEDBACK_SYSTEM_PROMPT,
  buildTaskFeedbackUserPrompt,
} from '../llm/prompts';
import { taskFeedback } from '../llm/client';
import type { TrainingTask } from '../types';

const TASK_TYPE_LABEL: Record<TrainingTask['type'], { icon: string; color: string }> = {
  'rewrite-practice': { icon: '✏️', color: '#1565c0' },
  'logic-prep': { icon: '🏗️', color: '#8b5cf6' },
  'remove-hedge': { icon: '💪', color: '#f59e0b' },
};

export function TasksPage() {
  const { currentSession, upsertCurrentSession, apiConfig, setView } = useStore();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentSession || !currentSession.report) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="emoji">🎯</div>
          <div>请先完成一次训练并复盘</div>
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

  const tasks = currentSession.tasks;

  async function submitTask(task: TrainingTask) {
    const answer = (answers[task.id] || '').trim();
    if (!answer) return;
    if (!apiConfig.apiKey) {
      setError('请先在「设置」中配置大模型 API 密钥');
      return;
    }
    setLoadingId(task.id);
    setError(null);
    try {
      const feedbackText = await taskFeedback(
        apiConfig,
        TASK_FEEDBACK_SYSTEM_PROMPT,
        buildTaskFeedbackUserPrompt(task.title, task.prompt, answer),
      );
      const updatedTasks = currentSession!.tasks.map((t) =>
        t.id === task.id
          ? { ...t, userAnswer: answer, feedback: feedbackText, completed: true }
          : t,
      );
      upsertCurrentSession({ tasks: updatedTasks });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`点评请求失败：${msg}`);
    } finally {
      setLoadingId(null);
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="page">
      <div className="row between center mb-md">
        <h1 className="page-title" style={{ margin: 0 }}>专项训练</h1>
        <span className="tag">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {error && (
        <div
          className="card mb-md"
          style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13 }}
        >
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📝</div>
          <div>本次未生成训练任务</div>
        </div>
      ) : (
        <div className="col gap-sm">
          {tasks.map((task, i) => {
            const meta = TASK_TYPE_LABEL[task.type];
            return (
              <div key={task.id} className="card">
                <div className="row center gap-sm mb-md">
                  <span style={{ fontSize: 22 }}>{meta.icon}</span>
                  <div className="grow">
                    <div style={{ fontWeight: 700 }}>
                      {i + 1}. {task.title}
                    </div>
                    <div className="muted text-sm">{task.description}</div>
                  </div>
                  {task.completed && (
                    <span
                      className="tag"
                      style={{ background: '#dcfce7', color: '#15803d' }}
                    >
                      已完成
                    </span>
                  )}
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--color-text)',
                  }}
                >
                  {task.prompt}
                </div>

                {!task.completed ? (
                  <>
                    <textarea
                      className="textarea"
                      placeholder="在此输入你的练习作答..."
                      value={answers[task.id] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [task.id]: e.target.value })
                      }
                      style={{ minHeight: 100 }}
                    />
                    <button
                      className="btn btn-primary mt-sm"
                      onClick={() => submitTask(task)}
                      disabled={loadingId === task.id || !answers[task.id]?.trim()}
                    >
                      {loadingId === task.id ? (
                        <>
                          <span className="spinner" /> 点评中...
                        </>
                      ) : (
                        '提交并获取点评'
                      )}
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                    }}
                  >
                    <div className="muted text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>
                      你的作答
                    </div>
                    <div style={{ marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                      {task.userAnswer}
                    </div>
                    <div className="muted text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>
                      教练点评
                    </div>
                    <div style={{ color: '#14532d', whiteSpace: 'pre-wrap' }}>
                      {task.feedback}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-ghost mt-md" onClick={() => setView('home')}>
        完成训练，返回首页
      </button>
    </div>
  );
}
