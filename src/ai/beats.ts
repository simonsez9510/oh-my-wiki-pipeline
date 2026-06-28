export interface ResearchCard {
  title: string;
  path: string;
  summary: string;
  evidence: string;
}

export type WritingLanguage = 'ko' | 'ru';

export interface BeatInput {
  chapterTitle: string;
  chapterBody: string;
  cards: ResearchCard[];
  feedback?: string;
  language?: WritingLanguage;
}

export interface Beat {
  title: string;
  line: string;
  quote: string;
  sources: string[];
  flags: string[];
  blocking: boolean;
}

interface BeatDraft {
  title: string;
  line: string;
  quote: string;
  sources: string[];
}

const YEAR_PATTERN = /\b(1[89]\d{2}|20\d{2})\b/g;
const MIN_QUOTE_LENGTH = 8;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function extractYears(text: string): string[] {
  return [...new Set(text.match(YEAR_PATTERN) ?? [])];
}

export function normalizeLanguage(value: unknown): WritingLanguage {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'ru' || normalized === 'russian' || normalized === '러시아어' || normalized === 'русский') {
      return 'ru';
    }
  }
  return 'ko';
}

export type LanguageTask = 'beat' | 'draft' | 'revise';

export function languageDirective(language: WritingLanguage | undefined, task: LanguageTask): string {
  if (language !== 'ru') {
    return '';
  }
  if (task === 'beat') {
    return ' 출력 언어: 러시아어. title과 line을 러시아어로 작성하라. sources(카드 제목)는 절대 번역·변경하지 말고 원문 그대로 두며, quote는 인용 카드 근거에서 그대로 복사한다(언어 불문).';
  }
  if (task === 'draft') {
    return ' 출력 언어: 러시아어. prose만 러시아어로 작성하라. beatTitle은 주어진 비트 제목과 정확히 일치시키고(절대 번역 금지), sources(카드 제목)도 원문 그대로 둔다.';
  }
  return ' 출력 언어: 러시아어. 다듬은 prose를 러시아어로 작성하라. index는 그대로 둔다.';
}

export function beatToolSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['beats'],
    properties: {
      beats: {
        type: 'array',
        minItems: 3,
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'line', 'quote', 'sources'],
          properties: {
            title: { type: 'string', description: '비트의 짧은 제목' },
            line: { type: 'string', description: '이 장면이 칠 구체적 순간 한 줄' },
            quote: {
              type: 'string',
              minLength: MIN_QUOTE_LENGTH,
              description: '인용한 자료조사 카드의 근거에서 그대로 복사한 원문 구절(최소 8자). 지어내지 말고 카드 원문을 복사할 것.'
            },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: '이 비트의 근거가 되는 자료조사 카드의 정확한 제목만. 카드에 없는 제목·사실을 지어내지 말 것.'
            }
          }
        }
      }
    }
  };
}

export function buildBeatMessages(input: BeatInput): { system: string; user: string } {
  const cards = input.cards.map((card) => ({ title: card.title, summary: card.summary, evidence: card.evidence }));

  return {
    system:
      '당신은 한국어 책 집필의 편집 조교다. 저자가 아니라 조교로 동작한다. 주어진 장(목차)과 자료조사 카드를 근거로, 그 장에서 칠 구체적 비트(장면·순간)의 시트를 제안한다. 비트 = 한 장면이 칠 구체적 순간 한 줄. 도구를 정확히 한 번만 호출한다. 주어진 장과 카드에 명시된 사실만 사용하고, 카드/장에 없는 연도·인명·장소·사건을 절대 지어내지 마라. 각 비트는 반드시 1개 이상의 카드를 sources로 인용하고, quote에는 그 카드 근거(evidence)에서 그대로 복사한 원문 구절을 넣어라.' +
      languageDirective(input.language, 'beat'),
    user: JSON.stringify({
      instruction:
        '아래 장과 카드로 3~8개의 비트를 서사 순서로 제안하라. 각 비트는 {title, line, quote, sources}. sources는 위 카드들의 정확한 제목만, quote는 그 카드 evidence의 원문 복사(최소 8자).',
      chapter: { title: input.chapterTitle, body: input.chapterBody },
      cards,
      ...(input.feedback && input.feedback.trim() !== ''
        ? { revisionFeedback: input.feedback.trim() }
        : {})
    })
  };
}

function evaluateBeat(draft: BeatDraft, input: BeatInput, cardByTitle: Map<string, ResearchCard>): Beat | null {
  const title = draft.title.trim();
  const line = draft.line.trim();
  const quote = draft.quote.trim();
  if (title === '' || line === '') {
    return null;
  }

  const sources = [...new Set(draft.sources.filter((value) => cardByTitle.has(value)))];
  const citedCards = sources
    .map((src) => cardByTitle.get(src))
    .filter((card): card is ResearchCard => card !== undefined);

  const citedCardText = collapseWhitespace(citedCards.map((card) => `${card.summary} ${card.evidence}`).join(' '));
  const yearText = collapseWhitespace([input.chapterBody, citedCardText].join(' '));
  const citedYears = new Set(extractYears(yearText));

  const flags: string[] = [];
  let blocking = false;
  if (sources.length === 0) {
    flags.push('출처 없음 — 근거 카드를 연결하세요 (저장 불가)');
    blocking = true;
  }
  const novelYears = extractYears(line).filter((year) => !citedYears.has(year));
  if (novelYears.length > 0) {
    flags.push(`원문에 없는 연도(${novelYears.join(', ')}) — 사실 확인 필요`);
  }
  const normalizedQuote = collapseWhitespace(quote);
  if (normalizedQuote === '') {
    flags.push('근거 구절 없음 — 카드 원문에서 인용하세요');
  } else if (normalizedQuote.length < MIN_QUOTE_LENGTH) {
    flags.push('근거 구절이 너무 짧음 — 카드 원문을 충분히 인용하세요');
  } else if (!citedCardText.includes(normalizedQuote)) {
    flags.push('근거 구절을 카드에서 찾을 수 없음 — 지어냈을 수 있음');
  }

  return { title, line, quote, sources, flags, blocking };
}

export function normalizeBeats(input: BeatInput, raw: unknown): Beat[] {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const rawBeats =
    raw && typeof raw === 'object' && Array.isArray((raw as { beats?: unknown }).beats)
      ? (raw as { beats: unknown[] }).beats
      : [];

  const result: Beat[] = [];
  for (const entry of rawBeats) {
    const beat = (entry ?? {}) as { title?: unknown; line?: unknown; quote?: unknown; sources?: unknown };
    const draft: BeatDraft = {
      title: typeof beat.title === 'string' ? beat.title : '',
      line: typeof beat.line === 'string' ? beat.line : '',
      quote: typeof beat.quote === 'string' ? beat.quote : '',
      sources: Array.isArray(beat.sources)
        ? beat.sources.filter((value): value is string => typeof value === 'string')
        : []
    };
    const evaluated = evaluateBeat(draft, input, cardByTitle);
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}

export function revalidateBeats(beats: Beat[], input: BeatInput): Beat[] {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const result: Beat[] = [];
  for (const beat of beats) {
    const evaluated = evaluateBeat(
      { title: beat.title, line: beat.line, quote: beat.quote, sources: beat.sources },
      input,
      cardByTitle
    );
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}

export interface SavableBeat {
  beat: Beat;
  sourceCards: ResearchCard[];
}

export function selectSavableBeats(beats: Beat[], cards: ResearchCard[]): SavableBeat[] {
  const cardByTitle = new Map(cards.map((card) => [card.title, card]));
  const result: SavableBeat[] = [];
  for (const beat of beats) {
    if (beat.title.trim() === '' || beat.line.trim() === '') {
      continue;
    }
    const sourceCards = beat.sources
      .map((title) => cardByTitle.get(title))
      .filter((card): card is ResearchCard => card !== undefined);
    if (beat.blocking || sourceCards.length === 0) {
      continue;
    }
    result.push({ beat, sourceCards });
  }
  return result;
}
