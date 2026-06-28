import { App, FileSystemAdapter, TFile, TFolder, normalizePath } from 'obsidian';
import type { Beat, ResearchCard } from '../ai/beats';
import { selectSavableBeats } from '../ai/beats';
import type { DraftSection, SourceBeat } from '../ai/draft';
import { selectSavableDraftSections } from '../ai/draft';
import type { RevisedSection } from '../ai/revise';
import type { Manuscript, ManuscriptSourceStage } from '../ai/manuscript';
import {
  buildBeatNoteContent,
  buildDraftNoteContent,
  buildManuscriptNoteContent,
  buildRevisionNoteContent,
  disambiguateCardTitles,
  disambiguateTitles,
  type DraftNoteSection,
  type RevisionNoteSection,
  extractWikiLink,
  extractWikiLinks,
  parseBeatNote,
  parseDraftNote,
  stripFrontmatter,
  toResearchCard,
  uniqueBasename,
  vaultPathMatches
} from './serialize';

export interface ChapterContext {
  title: string;
  body: string;
  cards: ResearchCard[];
}

export function getVaultBasePath(app: App): string | null {
  const adapter = app.vault.adapter;
  return adapter instanceof FileSystemAdapter ? adapter.getBasePath() : null;
}

export function checkVaultGuard(app: App, expectedVaultPath: string): { ok: boolean; reason?: string } {
  return vaultPathMatches(getVaultBasePath(app), expectedVaultPath);
}

function isResearchCard(frontmatter: Record<string, unknown> | undefined): boolean {
  if (!frontmatter) {
    return false;
  }
  return frontmatter.stage === '자료조사' || frontmatter.page_type === 'wiki_card';
}

export async function collectChapterContext(app: App, file: TFile): Promise<ChapterContext> {
  const raw = await app.vault.cachedRead(file);
  const cache = app.metadataCache.getFileCache(file);
  const cards: ResearchCard[] = [];
  const seen = new Set<string>();

  for (const link of cache?.links ?? []) {
    const dest = app.metadataCache.getFirstLinkpathDest(link.link, file.path);
    if (!dest || seen.has(dest.path)) {
      continue;
    }
    seen.add(dest.path);
    const frontmatter = app.metadataCache.getFileCache(dest)?.frontmatter as
      | Record<string, unknown>
      | undefined;
    if (!isResearchCard(frontmatter)) {
      continue;
    }
    const cardText = await app.vault.cachedRead(dest);
    cards.push(toResearchCard(dest.basename, dest.path, cardText));
  }

  return { title: file.basename, body: stripFrontmatter(raw), cards: disambiguateCardTitles(cards) };
}

function existingBasenames(app: App, folderPath: string): Set<string> {
  const target = folderPath === '' ? '/' : folderPath;
  const names = new Set<string>();
  for (const file of app.vault.getMarkdownFiles()) {
    const parentPath = file.parent?.path ?? '/';
    if (parentPath === target) {
      names.add(file.basename);
    }
  }
  return names;
}

function linkForPath(app: App, filePath: string, sourcePath: string): string {
  const dest = app.vault.getAbstractFileByPath(filePath);
  return dest instanceof TFile
    ? app.metadataCache.fileToLinktext(dest, sourcePath, true)
    : filePath.replace(/\.md$/i, '');
}

function resolveLink(app: App, card: ResearchCard, sourcePath: string): string {
  return linkForPath(app, card.path, sourcePath);
}

export async function saveBeatNotes(
  app: App,
  beats: Beat[],
  chapterFile: TFile,
  cards: ResearchCard[],
  folder: string
): Promise<TFile[]> {
  const savable = selectSavableBeats(beats, cards);
  if (savable.length === 0) {
    return [];
  }

  const dir = normalizePath(folder).replace(/^\/+$/, '');
  if (dir !== '' && !(app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
    await app.vault.createFolder(dir);
  }

  const existing = existingBasenames(app, dir);
  const created: TFile[] = [];

  for (const { beat, sourceCards } of savable) {
    const basename = uniqueBasename(`비트 — ${beat.title}`, existing);
    existing.add(basename);
    const path = normalizePath(dir === '' ? `${basename}.md` : `${dir}/${basename}.md`);

    const chapterLink = app.metadataCache.fileToLinktext(chapterFile, path, true);
    const sourceLinks = sourceCards.map((card) => resolveLink(app, card, path));

    const content = buildBeatNoteContent(beat, chapterLink, sourceLinks);
    created.push(await app.vault.create(path, content));
  }
  return created;
}

function isApprovedBeatNote(frontmatter: Record<string, unknown> | undefined): boolean {
  return frontmatter?.stage === '비트' && frontmatter?.status === '승인';
}

export async function collectApprovedBeats(
  app: App,
  chapterFile: TFile
): Promise<{ beats: SourceBeat[]; cards: ResearchCard[] }> {
  interface RawBeat {
    path: string;
    title: string;
    line: string;
    cardPaths: string[];
  }

  const raws: RawBeat[] = [];
  const cardByPath = new Map<string, ResearchCard>();

  for (const file of app.vault.getMarkdownFiles()) {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as
      | Record<string, unknown>
      | undefined;
    if (!isApprovedBeatNote(frontmatter)) {
      continue;
    }
    const chapterRaw = typeof frontmatter?.chapter === 'string' ? extractWikiLink(frontmatter.chapter) : null;
    if (!chapterRaw) {
      continue;
    }
    const chapterDest = app.metadataCache.getFirstLinkpathDest(chapterRaw, file.path);
    if (!chapterDest || chapterDest.path !== chapterFile.path) {
      continue;
    }

    const body = await app.vault.cachedRead(file);
    const { title, line } = parseBeatNote(body, file.basename);

    const cardPaths: string[] = [];
    const frontmatterSources = Array.isArray(frontmatter?.sources) ? frontmatter.sources : [];
    for (const rawSource of frontmatterSources) {
      for (const link of extractWikiLinks(String(rawSource))) {
        const dest = app.metadataCache.getFirstLinkpathDest(link, file.path);
        if (!dest) {
          continue;
        }
        const destFrontmatter = app.metadataCache.getFileCache(dest)?.frontmatter as
          | Record<string, unknown>
          | undefined;
        if (!isResearchCard(destFrontmatter)) {
          continue;
        }
        if (!cardByPath.has(dest.path)) {
          const cardText = await app.vault.cachedRead(dest);
          cardByPath.set(dest.path, toResearchCard(dest.basename, dest.path, cardText));
        }
        cardPaths.push(dest.path);
      }
    }

    raws.push({ path: file.path, title, line, cardPaths });
  }

  const cards = disambiguateCardTitles([...cardByPath.values()]);
  const titleByPath = new Map(cards.map((card) => [card.path, card.title]));
  const beats: SourceBeat[] = disambiguateTitles(
    raws.map((raw) => ({
      title: raw.title,
      line: raw.line,
      path: raw.path,
      sources: [...new Set(raw.cardPaths.map((cardPath) => titleByPath.get(cardPath)).filter((title): title is string => title !== undefined))]
    }))
  );

  return { beats, cards };
}

export async function saveDraftNote(
  app: App,
  sections: DraftSection[],
  chapterFile: TFile,
  beats: SourceBeat[],
  cards: ResearchCard[],
  folder: string
): Promise<TFile | null> {
  const savable = selectSavableDraftSections(sections, { chapterTitle: chapterFile.basename, beats, cards });
  if (savable.length === 0) {
    return null;
  }

  const dir = normalizePath(folder).replace(/^\/+$/, '');
  if (dir !== '' && !(app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
    await app.vault.createFolder(dir);
  }

  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`초안 — ${chapterFile.basename}`, existing);
  const path = normalizePath(dir === '' ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = app.metadataCache.fileToLinktext(chapterFile, path, true);

  const noteSections: DraftNoteSection[] = savable.map(({ section, beat, sourceCards }) => ({
    prose: section.prose,
    beatLink: beat.path ? linkForPath(app, beat.path, path) : beat.title,
    sourceLinks: sourceCards.map((card) => resolveLink(app, card, path)),
    flags: section.flags
  }));

  const content = buildDraftNoteContent(chapterFile.basename, chapterLink, noteSections);
  return app.vault.create(path, content);
}

function relinkText(app: App, linktext: string, fromPath: string, toPath: string): string {
  const dest = app.metadataCache.getFirstLinkpathDest(linktext, fromPath);
  return dest instanceof TFile ? app.metadataCache.fileToLinktext(dest, toPath, true) : linktext;
}

export interface DraftForRevision {
  chapterFile: TFile | null;
  chapterLinktext: string;
  sections: { prose: string; grounding: string[]; flags: string[] }[];
}

export async function readDraftForRevision(app: App, draftFile: TFile): Promise<DraftForRevision> {
  const body = await app.vault.cachedRead(draftFile);
  const sections = parseDraftNote(body);
  const frontmatter = app.metadataCache.getFileCache(draftFile)?.frontmatter as
    | Record<string, unknown>
    | undefined;
  const chapterRaw = typeof frontmatter?.chapter === 'string' ? extractWikiLink(frontmatter.chapter) : null;
  const chapterFile = chapterRaw ? app.metadataCache.getFirstLinkpathDest(chapterRaw, draftFile.path) : null;
  const chapterLinktext = chapterRaw ?? draftFile.basename;
  return { chapterFile, chapterLinktext, sections };
}

export async function saveRevisionNote(
  app: App,
  sections: RevisedSection[],
  draftFile: TFile,
  chapterFile: TFile | null,
  chapterLinktext: string,
  folder: string
): Promise<TFile | null> {
  const savable = sections.filter((section) => section.prose.trim() !== '');
  if (savable.length === 0) {
    return null;
  }

  const dir = normalizePath(folder).replace(/^\/+$/, '');
  if (dir !== '' && !(app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
    await app.vault.createFolder(dir);
  }

  const chapterName = chapterFile?.basename ?? chapterLinktext;
  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`퇴고 — ${chapterName}`, existing);
  const path = normalizePath(dir === '' ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = chapterFile ? app.metadataCache.fileToLinktext(chapterFile, path, true) : chapterLinktext;

  const noteSections: RevisionNoteSection[] = savable.map((section) => ({
    prose: section.prose,
    grounding: section.grounding.map((link) => relinkText(app, link, draftFile.path, path)),
    flags: section.flags
  }));

  const content = buildRevisionNoteContent(chapterName, chapterLink, noteSections);
  return app.vault.create(path, content);
}

export interface SourceForManuscript {
  chapterFile: TFile | null;
  chapterLinktext: string;
  fromStage: ManuscriptSourceStage;
  sections: { prose: string; grounding: string[]; flags: string[] }[];
  noteFlags: string[];
}

export async function readSourceForManuscript(app: App, sourceFile: TFile): Promise<SourceForManuscript> {
  const body = await app.vault.cachedRead(sourceFile);
  const sections = parseDraftNote(body);
  const frontmatter = app.metadataCache.getFileCache(sourceFile)?.frontmatter as
    | Record<string, unknown>
    | undefined;
  const fromStage: ManuscriptSourceStage = frontmatter?.stage === '퇴고' ? '퇴고' : '초안';
  const chapterRaw = typeof frontmatter?.chapter === 'string' ? extractWikiLink(frontmatter.chapter) : null;
  const chapterFile = chapterRaw ? app.metadataCache.getFirstLinkpathDest(chapterRaw, sourceFile.path) : null;
  const chapterLinktext = chapterRaw ?? sourceFile.basename;
  const noteFlags = Array.isArray(frontmatter?.flags)
    ? frontmatter.flags.map((flag) => String(flag).trim()).filter((flag) => flag !== '')
    : [];
  return { chapterFile, chapterLinktext, fromStage, sections, noteFlags };
}

export async function saveManuscriptNote(
  app: App,
  manuscript: Manuscript,
  sourceFile: TFile,
  chapterFile: TFile | null,
  chapterLinktext: string,
  folder: string
): Promise<TFile | null> {
  if (manuscript.paragraphs.length === 0) {
    return null;
  }

  const dir = normalizePath(folder).replace(/^\/+$/, '');
  if (dir !== '' && !(app.vault.getAbstractFileByPath(dir) instanceof TFolder)) {
    await app.vault.createFolder(dir);
  }

  const chapterName = chapterFile?.basename ?? chapterLinktext;
  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`원고 — ${chapterName}`, existing);
  const path = normalizePath(dir === '' ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = chapterFile ? app.metadataCache.fileToLinktext(chapterFile, path, true) : chapterLinktext;
  const assembledFrom = app.metadataCache.fileToLinktext(sourceFile, path, true);
  const seenSource = new Set<string>();
  const sources: string[] = [];
  for (const link of manuscript.sources) {
    const relinked = relinkText(app, link, sourceFile.path, path).trim();
    if (relinked !== '' && !seenSource.has(relinked)) {
      seenSource.add(relinked);
      sources.push(relinked);
    }
  }

  const content = buildManuscriptNoteContent(chapterName, chapterLink, {
    paragraphs: manuscript.paragraphs,
    sources,
    flags: manuscript.flags,
    assembledFrom,
    fromStage: manuscript.fromStage
  });
  return app.vault.create(path, content);
}
