import type { ApiConfig, ChatMessage } from '../types';

// OpenAI 兼容的消息格式
interface ApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 提取 JSON（兼容模型偶尔包裹 markdown 代码块的情况）
export function extractJson<T>(raw: string): T {
  let text = raw.trim();
  // 去除 ```json ... ``` 包裹
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    text = fence[1].trim();
  }
  // 去除首尾非 JSON 文字
  const start = text.indexOf('{');
  const startArr = text.indexOf('[');
  let head = -1;
  if (start !== -1 && startArr !== -1) head = Math.min(start, startArr);
  else if (start !== -1) head = start;
  else if (startArr !== -1) head = startArr;
  if (head > 0) text = text.slice(head);
  const tail = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (tail !== -1 && tail < text.length - 1) text = text.slice(0, tail + 1);
  return JSON.parse(text) as T;
}

// 统一调用 chat completions
async function chatCompletion(
  config: ApiConfig,
  messages: ApiMessage[],
  options: { jsonMode?: boolean; signal?: AbortSignal } = {},
): Promise<string> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: 0.8,
    stream: false,
  };
  if (options.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API 请求失败 (${res.status})：${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('API 返回格式异常：未找到消息内容');
  }
  return content;
}

// 对话回合（角色扮演）
export async function chatTurn(
  config: ApiConfig,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  const messages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map<ApiMessage>((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];
  return chatCompletion(config, messages, { signal });
}

// 复盘诊断（返回结构化 JSON）
export async function reviewDiagnosis(
  config: ApiConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const messages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  // 使用 json_mode 提升结构化输出稳定性
  return chatCompletion(config, messages, { jsonMode: true, signal });
}

// 训练任务生成
export async function generateTasks(
  config: ApiConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const messages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  // 任务要求 JSON 数组，部分兼容接口不支持 json_object 返回数组，改用普通模式后自行解析
  return chatCompletion(config, messages, { signal });
}

// 训练任务作答点评
export async function taskFeedback(
  config: ApiConfig,
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const messages: ApiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  return chatCompletion(config, messages, { signal });
}

// API 连通性测试
export async function testApiConnection(
  config: ApiConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const reply = await chatCompletion(config, [
      { role: 'system', content: '你是一个连通性测试助手。' },
      { role: 'user', content: '请回复"OK"'    },
    ]);
    return { ok: true, message: `连通正常：${reply.slice(0, 50)}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}
