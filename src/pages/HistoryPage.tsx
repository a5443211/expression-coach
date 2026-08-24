import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { TrainingSession } from '../types';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function HistoryPage() {
  const { sessions, removeSession, removeAllSessions, setCurrentSession, setView } =
    useStore();
  const [viewing, setViewing] = useState<TrainingSession | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function openSession(s: TrainingSession) {
    setViewing(s);
  }

  function resumeReview(s: TrainingSession) {
    setCurrentSession(s);
    setView('review');
  }

  if (viewing) {
    return (
      <div className="page">
        <button className="btn btn-ghost mb-md" onClick={() => setViewing(null)}>
          ← 返回列表
        </button>
        <div className="card mb-md">
          <div style={{ fontWeight: 700, fontSize: 17 }}>{viewing.scene.name}</div>
          <div className="muted text-sm mt-sm">
            {formatDate(viewing.createdAt)}
          </div>
          <div className="muted text-sm">
            我方：{viewing.scene.myRole} · 对手：{viewing.scene.opponentRole}
          </div>
          <div className="muted text-sm">目标：{viewing.scene.goal}</div>
        </div>

        <div className="card mb-md">
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
            对话记录
          </div>
          <div className="col gap-sm">
            {viewing.messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 14,
                  background:
                    m.role === 'user' ? '#dbeafe' : '#f1f5f9',
                  color: 'var(--color-text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <div className="muted text-sm" style={{ fontSize: 11, marginBottom: 2 }}>
                  {m.role === 'user' ? '我' : viewing.scene.opponentRole}
                </div>
                {m.content}
              </div>
            ))}
          </div>
        </div>

        {viewing.report && (
          <div className="card mb-md">
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
              复盘结论
            </div>
            <div
              className="row center gap-sm"
              style={{ flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}
            >
              {(['logic', 'persuasion', 'fluency', 'aura', 'clarity'] as const).map(
                (k) => (
                  <span key={k} className="tag">
                    {labelOf(k)}：{viewing.report!.scores[k]}
                  </span>
                ),
              )}
            </div>
            {viewing.report.summary && (
              <div className="text-sm" style={{ lineHeight: 1.7 }}>
                {viewing.report.summary}
              </div>
            )}
            <button
              className="btn btn-secondary mt-sm"
              onClick={() => resumeReview(viewing)}
            >
              查看完整复盘
            </button>
          </div>
        )}

        <button
          className="btn btn-danger"
          onClick={() => {
            removeSession(viewing.id);
            setViewing(null);
          }}
        >
          删除此会话
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">历史会话</h1>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📚</div>
          <div>还没有训练记录</div>
          <button
            className="btn btn-primary mt-md"
            style={{ width: 'auto', padding: '10px 24px', margin: '0 auto' }}
            onClick={() => setView('training')}
          >
            开始第一次训练
          </button>
        </div>
      ) : (
        <>
          <div className="col gap-sm">
            {sessions.map((s) => (
              <button
                key={s.id}
                className="card"
                style={{ textAlign: 'left' }}
                onClick={() => openSession(s)}
              >
                <div className="row between center">
                  <span style={{ fontWeight: 700 }}>{s.scene.name}</span>
                  <span
                    className="tag"
                    style={
                      s.scene.difficulty === 'high-pressure'
                        ? { background: '#fee2e2', color: '#b91c1c' }
                        : {}
                    }
                  >
                    {s.scene.difficulty === 'high-pressure' ? '高压' : '普通'}
                  </span>
                </div>
                <div className="muted text-sm mt-sm">
                  {formatDate(s.createdAt)} · {s.messages.length} 条对话
                </div>
                {s.report && (
                  <div className="muted text-sm mt-sm">
                    均分{' '}
                    {(
                      (s.report.scores.logic +
                        s.report.scores.persuasion +
                        s.report.scores.fluency +
                        s.report.scores.aura +
                        s.report.scores.clarity) /
                      5
                    ).toFixed(1)}
                  </div>
                )}
              </button>
            ))}
          </div>

          {confirmClear ? (
            <div className="card mt-md" style={{ background: '#fef2f2' }}>
              <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                确认删除全部 {sessions.length} 条会话？此操作不可撤销。
              </div>
              <div className="row gap-sm">
                <button
                  className="btn btn-danger grow"
                  onClick={() => {
                    removeAllSessions();
                    setConfirmClear(false);
                  }}
                >
                  确认删除
                </button>
                <button
                  className="btn btn-ghost grow"
                  onClick={() => setConfirmClear(false)}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost mt-md"
              onClick={() => setConfirmClear(true)}
            >
              清空全部会话
            </button>
          )}
        </>
      )}
    </div>
  );
}

function labelOf(key: 'logic' | 'persuasion' | 'fluency' | 'aura' | 'clarity'): string {
  const map = {
    logic: '逻辑',
    persuasion: '说服',
    fluency: '流利',
    aura: '气场',
    clarity: '清晰',
  };
  return map[key];
}
