import { requestUrl } from 'obsidian';
import { type Beat, type BeatInput, beatToolSchema, buildBeatMessages, normalizeBeats } from './beats';
import {
  type DraftInput,
  type DraftSection,
  buildDraftMessages,
  draftToolSchema,
  normalizeDraftSections
} from './draft';
import {
  type ReviseInput,
  type RevisedSection,
  buildReviseMessages,
  normalizeRevisions,
  reviseToolSchema
} from './revise';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_TOKENS = 4096;

export class AnthropicError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AnthropicError('Claude 호출이 시간 초과되었습니다 (2분). 잠시 후 다시 시도하세요.')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function extractToolInput(json: unknown, toolName: string): unknown {
  const content =
    json && typeof json === 'object' && Array.isArray((json as { content?: unknown }).content)
      ? (json as { content: unknown[] }).content
      : [];
  for (const block of content) {
    if (
      block &&
      typeof block === 'object' &&
      (block as { type?: unknown }).type === 'tool_use' &&
      (block as { name?: unknown }).name === toolName
    ) {
      return (block as { input?: unknown }).input;
    }
  }
  return null;
}

function extractApiError(response: { json?: unknown; text?: unknown }): string {
  try {
    const json = response.json as { error?: { message?: unknown } } | undefined;
    const message = json?.error?.message;
    if (typeof message === 'string' && message.trim() !== '') {
      return message.trim().slice(0, 300);
    }
  } catch (error) {
    return typeof response.text === 'string' ? response.text.trim().slice(0, 300) : '';
  }
  return typeof response.text === 'string' ? response.text.trim().slice(0, 300) : '';
}

async function callAnthropicTool(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  toolName: string,
  schema: Record<string, unknown>
): Promise<unknown> {
  if (apiKey.trim() === '') {
    throw new AnthropicError('Claude API 키가 설정되지 않았습니다. 플러그인 설정에서 키를 입력하세요.');
  }

  const payload = {
    model,
    max_tokens: MAX_TOKENS,
    system,
    tools: [{ name: toolName, description: '결과를 기록한다.', input_schema: schema }],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: user }]
  };

  let response;
  try {
    response = await withTimeout(
      requestUrl({
        url: ANTHROPIC_URL,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION
        },
        body: JSON.stringify(payload),
        throw: false
      }),
      REQUEST_TIMEOUT_MS
    );
  } catch (error) {
    if (error instanceof AnthropicError) {
      throw error;
    }
    throw new AnthropicError('Claude 호출에 실패했습니다. 네트워크 상태를 확인하세요.');
  }

  if (response.status >= 400) {
    const detail = extractApiError(response);
    const suffix = detail !== '' ? ` — ${detail}` : '';
    if (response.status === 401 || response.status === 403) {
      throw new AnthropicError(`Claude API 키가 거부되었습니다. 키를 다시 확인하세요${suffix}`);
    }
    if (response.status === 429) {
      throw new AnthropicError(`요청이 많아 거부되었습니다. 잠시 후 다시 시도하세요${suffix}`);
    }
    throw new AnthropicError(`Claude 호출 오류 (HTTP ${response.status})${suffix}`);
  }

  const toolInput = extractToolInput(response.json, toolName);
  if (toolInput === null) {
    throw new AnthropicError('Claude가 결과를 반환하지 않았습니다. 다시 시도하세요.');
  }
  return toolInput;
}

export async function requestBeats(apiKey: string, model: string, input: BeatInput): Promise<Beat[]> {
  const { system, user } = buildBeatMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, 'record_beats', beatToolSchema());
  return normalizeBeats(input, toolInput);
}

export async function requestDraft(apiKey: string, model: string, input: DraftInput): Promise<DraftSection[]> {
  const { system, user } = buildDraftMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, 'record_draft', draftToolSchema());
  return normalizeDraftSections(input, toolInput);
}

export async function requestRevision(apiKey: string, model: string, input: ReviseInput): Promise<RevisedSection[]> {
  const { system, user } = buildReviseMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, 'record_revision', reviseToolSchema());
  return normalizeRevisions(input, toolInput);
}
