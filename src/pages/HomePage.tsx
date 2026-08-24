import { useStore } from '../store/StoreContext';

export function HomePage() {
  const { setView, weaknessTags, sessions, apiConfig } = useStore();

  const trainedCount = sessions.length;
  const hasWeakness = weaknessTags.length > 0;
  const hasApiKey = !!apiConfig.apiKey;

  return (
    <div className="page">
      <div
        style={{
          background:
            'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 55%, var(--color-primary-bright) 100%)',
          color: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-md)',
          boxShadow: '0 8px 24px rgba(11, 61, 145, 0.25)',
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9 }}>个人专属表达力训练</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
          表达力复盘教练
        </h1>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 8, lineHeight: 1.6 }}>
          模拟真实对话场景，AI 扮演对手完整对练，结束后统一复盘诊断逻辑、说服力、气场，沉淀个人弱点持续提升。
        </p>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => setView('training')}
        style={{ fontSize: 17, padding: '16px' }}
      >
        开始训练
      </button>

      <div className="row mt-md gap-sm">
        <div className="card grow" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1565c0' }}>
            {trainedCount}
          </div>
          <div className="muted text-sm">累计训练</div>
        </div>
        <div className="card grow" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1565c0' }}>
            {weaknessTags.length}
          </div>
          <div className="muted text-sm">弱点标签</div>
        </div>
      </div>

      <div className="card mt-md">
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          快速入口
        </div>
        <div className="col gap-sm">
          <button
            className="btn btn-secondary"
            onClick={() => setView('history')}
          >
            历史会话
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setView('weakness')}
          >
            个人弱点档案
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setView('settings')}
          >
            大模型 API 配置
          </button>
        </div>
      </div>

      {!hasApiKey && (
        <div
          className="card mt-md"
          style={{
            background: '#fef3c7',
            border: '1px solid #fde68a',
            color: '#92400e',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            提示：尚未配置大模型 API 密钥
          </div>
          <div className="text-sm">
            训练与复盘需要调用大模型。请前往「设置」填入 DeepSeek / GLM-4
            的 API Key。
          </div>
        </div>
      )}

      {hasWeakness && (
        <div className="card mt-md">
          <div className="muted text-sm mb-md" style={{ fontWeight: 600 }}>
            你的高频弱点
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {weaknessTags.slice(0, 5).map((w) => (
              <span
                key={w.tag}
                className="tag"
                style={{ background: '#fee2e2', color: '#b91c1c' }}
              >
                {w.tag} · {w.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
