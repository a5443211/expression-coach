import { useState } from 'react';
import { useStore } from '../store/StoreContext';

export function WeaknessPage() {
  const { weaknessTags, clearWeakness } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const maxCount = weaknessTags[0]?.count ?? 1;

  return (
    <div className="page">
      <h1 className="page-title">个人弱点档案</h1>

      <div className="card mb-md" style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
        <div className="text-sm" style={{ color: '#1e40af', lineHeight: 1.7 }}>
          每次复盘后系统自动从报告中提取高频弱点标签。开启新一轮训练时，AI
          对手与复盘环节会参考你的历史弱点，有针对性地考察与诊断。
        </div>
      </div>

      {weaknessTags.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <div>暂无弱点记录</div>
          <div className="muted text-sm mt-sm">
            完成训练并复盘后，高频问题会自动沉淀到这里
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-md)' }}>
              高频弱点统计（按出现次数排序）
            </div>
            <div className="col gap-sm">
              {weaknessTags.map((w) => (
                <div key={w.tag}>
                  <div className="row between center mb-md" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                      }}
                    >
                      {w.tag}
                    </span>
                    <span className="muted text-sm">{w.count} 次</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: '#f1f5f9',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(w.count / maxCount) * 100}%`,
                        background:
                          w.count >= 3
                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                            : 'linear-gradient(90deg, #0b3d91, #1565c0)',
                        borderRadius: 4,
                        transition: 'width 0.4s',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {confirmClear ? (
            <div className="card mt-md" style={{ background: '#fef2f2' }}>
              <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                确认清除全部弱点档案？下次训练将不再参考历史弱点。
              </div>
              <div className="row gap-sm">
                <button
                  className="btn btn-danger grow"
                  onClick={() => {
                    clearWeakness();
                    setConfirmClear(false);
                  }}
                >
                  确认清除
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
              清除弱点档案
            </button>
          )}
        </>
      )}
    </div>
  );
}
