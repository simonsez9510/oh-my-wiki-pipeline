import { App, Modal } from 'obsidian';
import type { Manuscript } from '../ai/manuscript';

export interface ManuscriptPreviewCallbacks {
  onApprove: () => void | Promise<void>;
}

export class ManuscriptPreviewModal extends Modal {
  private readonly manuscript: Manuscript;
  private readonly callbacks: ManuscriptPreviewCallbacks;

  constructor(app: App, manuscript: Manuscript, callbacks: ManuscriptPreviewCallbacks) {
    super(app);
    this.manuscript = manuscript;
    this.callbacks = callbacks;
  }

  onOpen(): void {
    this.modalEl.addClass('omw-beat-modal');
    const { contentEl, manuscript } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '원고 조립 — 승인 전 무저장' });
    contentEl.createEl('p', {
      text: `${manuscript.fromStage} ${manuscript.paragraphs.length}개 단락을 최종 원고로 조립합니다. 새 문장·사실은 추가하지 않습니다.`
    });

    if (manuscript.flags.length > 0) {
      const warn = contentEl.createDiv({ cls: 'omw-beat-row omw-beat-flagged' });
      warn.createEl('div', {
        cls: 'omw-beat-flag',
        text: `⚠️ 미해결 확인 항목 ${manuscript.flags.length}건이 원고 끝에 그대로 표시됩니다:`
      });
      for (const flag of manuscript.flags) {
        warn.createEl('div', { cls: 'omw-beat-flag', text: `⚠️ ${flag}` });
      }
    }

    const list = contentEl.createDiv({ cls: 'omw-beat-list' });
    manuscript.paragraphs.forEach((para) => {
      const row = list.createDiv({ cls: 'omw-beat-row' });
      row.createEl('div', { cls: 'omw-manuscript-para', text: para });
    });

    contentEl.createDiv({
      cls: 'omw-beat-sources',
      text: `출처 ${manuscript.sources.length}건이 frontmatter(sources)와 원본 링크(assembled_from)로 보존됩니다.`
    });

    const footer = contentEl.createDiv({ cls: 'omw-beat-footer' });
    const approve = footer.createEl('button', { text: '승인 — 원고 저장', cls: 'mod-cta' });
    approve.addEventListener('click', async () => {
      this.close();
      await this.callbacks.onApprove();
    });
    const cancel = footer.createEl('button', { text: '취소' });
    cancel.addEventListener('click', () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
