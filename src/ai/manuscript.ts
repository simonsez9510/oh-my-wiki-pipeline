export type ManuscriptSourceStage = '초안' | '퇴고';

export interface ManuscriptSection {
  prose: string;
  grounding: string[];
  flags: string[];
}

export interface ManuscriptInput {
  chapterTitle: string;
  fromStage: ManuscriptSourceStage;
  sections: ManuscriptSection[];
  noteFlags?: string[];
}

export interface Manuscript {
  chapterTitle: string;
  fromStage: ManuscriptSourceStage;
  paragraphs: string[];
  sources: string[];
  flags: string[];
}

function dedupePush(target: string[], seen: Set<string>, value: string): void {
  const key = value.trim();
  if (key !== '' && !seen.has(key)) {
    seen.add(key);
    target.push(key);
  }
}

export function assembleManuscript(input: ManuscriptInput): Manuscript {
  const paragraphs: string[] = [];
  const sources: string[] = [];
  const flags: string[] = [];
  const seenSource = new Set<string>();
  const seenFlag = new Set<string>();

  for (const section of input.sections) {
    const prose = section.prose.trim();
    if (prose === '') {
      continue;
    }
    paragraphs.push(prose);
    for (const link of section.grounding) {
      dedupePush(sources, seenSource, link);
    }
    for (const flag of section.flags) {
      dedupePush(flags, seenFlag, flag);
    }
  }

  for (const flag of input.noteFlags ?? []) {
    dedupePush(flags, seenFlag, flag);
  }

  return {
    chapterTitle: input.chapterTitle,
    fromStage: input.fromStage,
    paragraphs,
    sources,
    flags
  };
}

export function manuscriptHasFlags(manuscript: Manuscript): boolean {
  return manuscript.flags.length > 0;
}
