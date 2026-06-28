import { Notice, TFile } from 'obsidian';
import type OmwPipelinePlugin from '../main';
import { assembleManuscript, type ManuscriptInput } from '../ai/manuscript';
import { sanitizeVaultFolder } from '../vault/serialize';
import { checkVaultGuard, readSourceForManuscript, saveManuscriptNote } from '../vault/notes';
import { ManuscriptPreviewModal } from '../ui/ManuscriptPreviewModal';

export async function proposeManuscriptCommand(plugin: OmwPipelinePlugin): Promise<void> {
  const { app, settings } = plugin;

  const file = app.workspace.getActiveFile();
  if (!(file instanceof TFile)) {
    new Notice('퇴고(stage:퇴고) 또는 초안(stage:초안) 노트를 먼저 여세요.');
    return;
  }

  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
  const stage = frontmatter?.stage;
  if (stage !== '퇴고' && stage !== '초안') {
    new Notice('이 명령은 퇴고(stage:퇴고) 또는 초안(stage:초안) 노트에서 실행하세요.');
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

  const source = await readSourceForManuscript(app, file);
  if (source.sections.length === 0) {
    new Notice('이 노트에서 단락을 찾지 못했습니다.');
    return;
  }

  const chapterTitle = source.chapterFile?.basename ?? source.chapterLinktext;
  const input: ManuscriptInput = {
    chapterTitle,
    fromStage: source.fromStage,
    sections: source.sections,
    noteFlags: source.noteFlags
  };
  const manuscript = assembleManuscript(input);
  if (manuscript.paragraphs.length === 0) {
    new Notice('조립할 단락이 없습니다.');
    return;
  }

  new ManuscriptPreviewModal(app, manuscript, {
    onApprove: async () => {
      const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
      if (!saveGuard.ok) {
        new Notice(saveGuard.reason ?? 'vault 경로 가드에 막혀 저장을 중단했습니다.');
        return;
      }
      try {
        const created = await saveManuscriptNote(
          app,
          manuscript,
          file,
          source.chapterFile,
          source.chapterLinktext,
          folder
        );
        if (created === null) {
          new Notice('조립할 단락이 없어 저장하지 않았습니다.');
          return;
        }
        const flagNote = manuscript.flags.length > 0 ? ` (확인 필요 ${manuscript.flags.length}건 표시)` : '';
        new Notice(`원고 노트를 저장했습니다${flagNote}.`);
      } catch (error) {
        new Notice('원고 노트 저장에 실패했습니다.');
      }
    }
  }).open();
}
