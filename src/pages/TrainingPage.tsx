import { useEffect, useRef, useState } from 'react';
import { PRESET_SCENES } from '../data/scenes';
import { useStore } from '../store/StoreContext';
import {
  buildOpponentSystemPrompt,
} from '../llm/prompts';
import { chatTurn } from '../llm/client';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type {
  ChatMessage,
  Difficulty,
  TrainingScene,
} from '../types';

type Phase = 'select' | 'chat';

function makeSceneId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function TrainingPage() {
  const { currentSession, setCurrentSession, apiConfig, weaknessTags, setView } =
    useStore();
  const [phase, setPhase] = useState<Phase>(
    currentSession ? 'chat' : 'select',
  );

  // 场景选择状态
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [custom, setCustom] = useState({
    name: '自定义场景',
    myRole: '',
    opponentRole: '',
    background: '',
    goal: '',
  });

  // 对话状态
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const speech = useSpeechRecognition();

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages.length, sending]);

  // 语音识别实时回填
  useEffect(() => {
    if (speech.interim) setInput(speech.interim);
  }, [speech.interim]);

  function buildScene(): TrainingScene {
    if (mode === 'preset') {
      const s = PRESET_SCENES[selectedIdx];
      return { ...s, id: makeSceneId(), difficulty };
    }
    return {
      id: makeSceneId(),
      source: 'custom',
      name: custom.name || '自定义场景',
      myRole: custom.myRole || '我',
      opponentRole: custom.opponentRole || '对方',
      background: custom.background || '（未填写背景）',
      goal: custom.goal || '（未填写目标）',
      difficulty,
    };
  }

  async function startTraining() {
    const scene = buildScene();
    const session = {
      id: scene.id,
      scene,
      messages: [] as ChatMessage[],
      report: null,
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentSession(session);
    setPhase('chat');
    setError(null);
    // 让 AI 对手发起开场
    await sendOpening(scene);
  }

  async function sendOpening(scene: TrainingScene) {
    if (!apiConfig.apiKey) {
      setError('请先在「设置」中配置大模型 API 密钥');
      return;
    }
    setSending(true);
    try {
      const systemPrompt = buildOpponentSystemPrompt(scene, weaknessTags);
      const reply = await chatTurn(
        apiConfig,
        systemPrompt,
        [],
        '请以你的角色身份开场，开始这段对话。',
      );
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setCurrentSession({
        id: scene.id,
        scene,
        messages: [aiMsg],
        report: null,
        tasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`对手开场失败：${msg}`);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage() {
    if (!currentSession) return;
    const text = input.trim();
    if (!text || sending) return;
    if (!apiConfig.apiKey) {
      setError('请先在「设置」中配置大模型 API 密钥');
      return;
    }
    setInput('');
    speech.stop();
    setError(null);

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const updatedMessages = [...currentSession.messages, userMsg];
    setCurrentSession({ ...currentSession, messages: updatedMessages });
    setSending(true);
    try {
      const systemPrompt = buildOpponentSystemPrompt(
        currentSession.scene,
        weaknessTags,
      );
      const reply = await chatTurn(
        apiConfig,
        systemPrompt,
        currentSession.messages,
        text,
      );
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setCurrentSession({
        ...currentSession,
        messages: [...updatedMessages, aiMsg],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`对手回复失败：${msg}`);
    } finally {
      setSending(false);
    }
  }

  function toggleVoice() {
    if (speech.listening) {
      speech.stop();
      const final = speech.getFinalText();
      if (final) setInput(final);
    } else {
      setInput('');
      speech.start();
    }
  }

  function endConversation() {
    if (!currentSession) return;
    if (currentSession.messages.length < 2) {
      setError('对话轮次太少，请至少完成一轮对话后再结束');
      return;
    }
    setView('review');
  }

  // ---------- 场景选择阶段 ----------
  if (phase === 'select' || !currentSession) {
    return (
      <div className="page">
        <h1 className="page-title">选择训练场景</h1>

        <div className="row mb-md" style={{ gap: 0, background: '#f1f5f9', borderRadius: 'var(--radius-sm)', padding: 4 }}>
          <button
            className="grow"
            onClick={() => setMode('preset')}
            style={{
              padding: '10px',
              borderRadius: 10,
              fontWeight: 600,
              background: mode === 'preset' ? '#fff' : 'transparent',
              color: mode === 'preset' ? '#1565c0' : '#64748b',
              boxShadow: mode === 'preset' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            预设场景
          </button>
          <button
            className="grow"
            onClick={() => setMode('custom')}
            style={{
              padding: '10px',
              borderRadius: 10,
              fontWeight: 600,
              background: mode === 'custom' ? '#fff' : 'transparent',
              color: mode === 'custom' ? '#1565c0' : '#64748b',
              boxShadow: mode === 'custom' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            自定义场景
          </button>
        </div>

        {mode === 'preset' ? (
          <div className="col gap-sm">
            {PRESET_SCENES.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setSelectedIdx(i)}
                className="card"
                style={{
                  textAlign: 'left',
                  border:
                    selectedIdx === i
                      ? '2px solid #1565c0'
                      : '1px solid var(--color-border)',
                  background:
                    selectedIdx === i ? '#eff6ff' : 'var(--color-card)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                <div className="muted text-sm">
                  我方：{s.myRole} · 对手：{s.opponentRole}
                </div>
                <div className="muted text-sm mt-sm">{s.background}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card">
            <label className="field">
              <span>场景名称</span>
              <input
                className="input"
                value={custom.name}
                onChange={(e) =>
                  setCustom({ ...custom, name: e.target.value })
                }
                placeholder="如：跨部门协调沟通"
              />
            </label>
            <label className="field">
              <span>我的身份</span>
              <input
                className="input"
                value={custom.myRole}
                onChange={(e) =>
                  setCustom({ ...custom, myRole: e.target.value })
                }
                placeholder="如：产品负责人"
              />
            </label>
            <label className="field">
              <span>对方身份</span>
              <input
                className="input"
                value={custom.opponentRole}
                onChange={(e) =>
                  setCustom({ ...custom, opponentRole: e.target.value })
                }
                placeholder="如：技术负责人"
              />
            </label>
            <label className="field">
              <span>沟通背景</span>
              <textarea
                className="textarea"
                value={custom.background}
                onChange={(e) =>
                  setCustom({ ...custom, background: e.target.value })
                }
                placeholder="描述本次沟通的情境..."
              />
            </label>
            <label className="field">
              <span>本次沟通目标</span>
              <textarea
                className="textarea"
                value={custom.goal}
                onChange={(e) =>
                  setCustom({ ...custom, goal: e.target.value })
                }
                placeholder="你希望达成的目标..."
              />
            </label>
          </div>
        )}

        <label className="field mt-md">
          <span>难度模式</span>
          <div className="row gap-sm">
            <button
              className="grow"
              onClick={() => setDifficulty('normal')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border:
                  difficulty === 'normal'
                    ? '2px solid #3b82f6'
                    : '1px solid var(--color-border)',
                background:
                  difficulty === 'normal' ? '#eff6ff' : 'var(--color-card)',
                color:
                  difficulty === 'normal' ? '#1565c0' : 'var(--color-text)',
              }}
            >
              普通模式
            </button>
            <button
              className="grow"
              onClick={() => setDifficulty('high-pressure')}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                border:
                  difficulty === 'high-pressure'
                    ? '2px solid #ef4444'
                    : '1px solid var(--color-border)',
                background:
                  difficulty === 'high-pressure' ? '#fef2f2' : 'var(--color-card)',
                color:
                  difficulty === 'high-pressure'
                    ? '#ef4444'
                    : 'var(--color-text)',
              }}
            >
              高压对抗
            </button>
          </div>
        </label>

        {error && (
          <div
            className="card mt-sm"
            style={{ background: '#fef2f2', color: '#dc2626', fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-primary mt-md"
          onClick={startTraining}
          disabled={sending}
        >
          {sending ? (
            <>
              <span className="spinner" /> 对手正在就位...
            </>
          ) : (
            '开始对练'
          )}
        </button>
      </div>
    );
  }

  // ---------- 对话阶段 ----------
  const scene = currentSession.scene;
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))',
      }}
    >
      {/* 场景信息头 */}
      <div
        className="card"
        style={{
          margin: 'var(--space-md)',
          marginBottom: 0,
          background: '#eff6ff',
          border: '1px solid #dbeafe',
        }}
      >
        <div className="row between center">
          <div style={{ fontWeight: 700, fontSize: 15 }}>{scene.name}</div>
          <span
            className="tag"
            style={
              scene.difficulty === 'high-pressure'
                ? { background: '#fee2e2', color: '#b91c1c' }
                : {}
            }
          >
            {scene.difficulty === 'high-pressure' ? '高压对抗' : '普通模式'}
          </span>
        </div>
        <div className="muted text-sm mt-sm">
          我方：{scene.myRole} · 对手：{scene.opponentRole}
        </div>
        <div className="muted text-sm">目标：{scene.goal}</div>
      </div>

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
      >
        {currentSession.messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent:
                m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: 16,
                background:
                  m.role === 'user'
                    ? 'var(--color-user-bubble)'
                    : 'var(--color-ai-bubble)',
                color: m.role === 'user' ? '#fff' : 'var(--color-text)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
              }}
            >
              {m.role === 'assistant' && (
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.6,
                    marginBottom: 2,
                    fontWeight: 600,
                  }}
                >
                  {scene.opponentRole}
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 16,
                background: 'var(--color-ai-bubble)',
                borderBottomLeftRadius: 4,
              }}
            >
              <span className="spinner spinner-dark" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div
          style={{
            margin: '0 var(--space-md)',
            padding: '10px 14px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* 输入区 */}
      <div
        style={{
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--color-card)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="row center gap-sm">
          {speech.supported && (
            <button
              onClick={toggleVoice}
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 12,
                background: speech.listening ? '#ef4444' : 'var(--color-primary-light)',
                color: speech.listening ? '#fff' : 'var(--color-primary)',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="语音输入"
            >
              {speech.listening ? '■' : '🎤'}
            </button>
          )}
          <textarea
            className="textarea grow"
            style={{ minHeight: 44, maxHeight: 100 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={speech.listening ? '正在聆听...' : '输入你的发言...'}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0 16px', height: 44, flexShrink: 0 }}
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            发送
          </button>
        </div>
        {speech.error && (
          <div className="muted text-sm mt-sm" style={{ color: '#dc2626' }}>
            {speech.error}
          </div>
        )}
        <button
          className="btn btn-danger mt-sm"
          onClick={endConversation}
          style={{ height: 44 }}
        >
          结束对话，开始复盘
        </button>
      </div>
    </div>
  );
}
