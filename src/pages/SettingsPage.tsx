import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { testApiConnection } from '../llm/client';
import type { ApiConfig } from '../types';

interface Preset {
  label: string;
  baseUrl: string;
  model: string;
}

const PRESETS: Preset[] = [
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '智谱 GLM-4', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'OpenAI 兼容', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
];

export function SettingsPage() {
  const { apiConfig, updateApiConfig } = useStore();
  const [form, setForm] = useState<ApiConfig>(apiConfig);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function applyPreset(p: Preset) {
    setForm({ ...form, baseUrl: p.baseUrl, model: p.model });
    setSaved(false);
  }

  function save() {
    updateApiConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    // 先保存当前表单再测试
    updateApiConfig(form);
    setTesting(true);
    setTestResult(null);
    const result = await testApiConnection(form);
    setTestResult(result);
    setTesting(false);
  }

  return (
    <div className="page">
      <h1 className="page-title">大模型 API 配置</h1>

      <div className="card mb-md" style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}>
        <div className="text-sm" style={{ color: '#1e40af', lineHeight: 1.7 }}>
          API 密钥仅保存在你的浏览器本地（localStorage），不会上传到任何服务器。请填入
          OpenAI 兼容接口的密钥与地址。
        </div>
      </div>

      <div className="card mb-md">
        <div className="muted text-sm mb-md" style={{ fontWeight: 600 }}>
          快速预设
        </div>
        <div className="row gap-sm">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="grow btn btn-secondary"
              style={{ width: 'auto', fontSize: 13, padding: '8px' }}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="field">
          <span>API 地址（Base URL）</span>
          <input
            className="input"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
          />
        </label>
        <label className="field">
          <span>API Key</span>
          <input
            className="input"
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </label>
        <label className="field">
          <span>模型名称</span>
          <input
            className="input"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="deepseek-chat"
          />
        </label>

        <div className="row gap-sm">
          <button className="btn btn-primary grow" onClick={save}>
            保存配置
          </button>
          <button
            className="btn btn-secondary grow"
            onClick={test}
            disabled={testing || !form.apiKey}
          >
            {testing ? (
              <>
                <span className="spinner spinner-dark" /> 测试中
              </>
            ) : (
              '连通性测试'
            )}
          </button>
        </div>

        {saved && (
          <div className="mt-sm text-sm" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            配置已保存
          </div>
        )}
        {testResult && (
          <div
            className="card mt-sm"
            style={{
              background: testResult.ok ? '#f0fdf4' : '#fef2f2',
              color: testResult.ok ? '#14532d' : '#dc2626',
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {testResult.ok ? '✓ 连通正常' : '✗ 连接失败'}
            </div>
            {testResult.message}
          </div>
        )}
      </div>

      <div className="card mt-md">
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          关于 API 密钥
        </div>
        <div className="muted text-sm" style={{ lineHeight: 1.8 }}>
          · 本应用为纯前端项目，所有数据存储在浏览器本地，不经过任何后端。
          <br />· 大模型请求由浏览器直接发起，密钥不会离开你的设备。
          <br />· 推荐使用 DeepSeek（性价比高）或智谱 GLM-4 等国内接口。
          <br />· 如遇跨域（CORS）错误，请选择支持浏览器直连的接口或使用官方提供的 CORS 兼容端点。
        </div>
      </div>
    </div>
  );
}
