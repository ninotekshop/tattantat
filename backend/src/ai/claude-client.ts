export type ChatMsg = { role: 'user' | 'assistant'; content: string };

/** AI chỉ bật khi có ANTHROPIC_API_KEY và AI_PROVIDER không bị đặt là mock. */
export function aiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.ANTHROPIC_API_KEY && (env.AI_PROVIDER ?? 'anthropic').toLowerCase() === 'anthropic';
}

export async function askClaude(o: { system?: string; messages: ChatMsg[]; maxTokens: number; timeoutMs: number }): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-haiku-4-5', max_tokens: o.maxTokens, ...(o.system ? { system: o.system } : {}), messages: o.messages }),
    signal: AbortSignal.timeout(o.timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json() as { content?: { type: string; text?: string }[] };
  return j.content?.find(c => c.type === 'text')?.text ?? '';
}
