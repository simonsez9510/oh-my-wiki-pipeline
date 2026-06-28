import { Notice, TFile } from 'obsidian';
import type OmwPipelinePlugin from '../main';
import type { DraftSection } from '../ai/draft';
import type { ReviseInput, RevisedSection } from '../ai/revise';
import { allowedYearsForRevision, revalidateRevisedSections } from '../ai/revise';
import { normalizeLanguage } from '../ai/beats';
import { AnthropicError, requestRevision } from '../ai/client';
import { DraftApprovalModal } from '../ui/DraftApprovalModal';
import { loadLocalKey } from '../secret';
import { sanitizeVaultFolder } from '../vault/serialize';
import { checkVaultGuard, readDraftForRevision, saveRevisionNote } from '../vault/notes';

const REVISION_LABELS = {
  heading: '퇴고 제안 — 승인 전 무저장',
  intro: '다듬은 단락을 검토·편집하고 채택하세요. 승인 시 한 편의 퇴고 노트로 저장됩니다.',
  approve: '승인 — 퇴고 저장',
  regenerate: '피드백으로 다시 다듬기'
};

export async function proposeRevisionCommand(plugin: OmwPipelinePlugin): Promise<void> {
  const { app, settings } = plugin;

  const file = app.workspace.getActiveFile();
  if (!(file instanceof TFile)) {
    new Notice('초안(stage:초안) 노트를 먼저 여세요.');
    return;
  }

  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
  if (frontmatter?.stage !== '초안') {
    new Notice('이 명령은 초안(stage:초안) 노트에서 실행하세요.');
    return;
  }

  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new Notice(guard.reason ?? 'vault 경로 가드에 막혀 중단했습니다.');
    return;
  }

  const requestedFolder = settings.beatFolder !== '' ? settings.beatFolder : file.parent?.path ?? '';
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new Notice('노트 폴더 경로가 올바르지 않습니다. 설정에서 vault 내부 상대 경로로 지정하세요.');
    return;
  }

  const draft = await readDraftForRevision(app, file);
  if (draft.sections.length === 0) {
    new Notice('이 초안 노트에서 단락을 찾지 못했습니다.');
    return;
  }

  const chapterTitle = draft.chapterFile?.basename ?? draft.chapterLinktext;
  const allowedYears = allowedYearsForRevision(draft.sections);
  const language = normalizeLanguage(
    draft.chapterFile ? app.metadataCache.getFileCache(draft.chapterFile)?.frontmatter?.lang : undefined
  );

  const generate = async (feedback?: string): Promise<void> => {
    const input: ReviseInput = { chapterTitle, sections: draft.sections, feedback, language };

    const progress = new Notice('퇴고 중…', 0);
    let revised;
    try {
      revised = await requestRevision(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new Notice(error instanceof AnthropicError ? error.message : '퇴고에 실패했습니다.');
      return;
    }
    progress.hide();

    if (revised.length === 0) {
      new Notice('다듬은 단락이 없습니다. 다시 시도하세요.');
      return;
    }

    const draftSections: DraftSection[] = revised.map((section, index) => ({
      beatTitle: `단락 ${index + 1}`,
      prose: section.prose,
      sources: section.grounding,
      flags: section.flags,
      blocking: false
    }));

    new DraftApprovalModal(
      app,
      draftSections,
      {
        onApprove: async (selected) => {
          if (selected.length === 0) {
            new Notice('채택된 단락이 없어 저장하지 않았습니다.');
            return;
          }
          const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
          if (!saveGuard.ok) {
            new Notice(saveGuard.reason ?? 'vault 경로 가드에 막혀 저장을 중단했습니다.');
            return;
          }
          const edited: RevisedSection[] = selected.map((section) => ({
            prose: section.prose,
            grounding: section.sources,
            flags: section.flags
          }));
          const revisedSections = revalidateRevisedSections(edited, allowedYears);
          try {
            const created = await saveRevisionNote(
              app,
              revisedSections,
              file,
              draft.chapterFile,
              draft.chapterLinktext,
              folder
            );
            if (created === null) {
              new Notice('저장 가능한 단락이 없어 저장하지 않았습니다.');
              return;
            }
            new Notice('퇴고 노트를 저장했습니다.');
          } catch (error) {
            new Notice('퇴고 노트 저장에 실패했습니다.');
          }
        },
        onRegenerate: async (feedbackText) => {
          await generate(feedbackText);
        }
      },
      REVISION_LABELS
    ).open();
  };

  await generate();
}
