import { Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, type OmwSettings, OmwSettingTab } from './settings';
import { hasSavedKey, saveLocalKey } from './secret';
import { proposeBeatsCommand } from './commands/proposeBeats';
import { proposeDraftCommand } from './commands/proposeDraft';
import { proposeRevisionCommand } from './commands/proposeRevision';
import { proposeManuscriptCommand } from './commands/proposeManuscript';

export default class OmwPipelinePlugin extends Plugin {
  settings: OmwSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: 'propose-beats',
      name: '비트 제안 — 이 장의 자료조사로',
      callback: () => {
        void proposeBeatsCommand(this);
      }
    });

    this.addCommand({
      id: 'propose-draft',
      name: '초안 생성 — 이 장의 비트로',
      callback: () => {
        void proposeDraftCommand(this);
      }
    });

    this.addCommand({
      id: 'propose-revision',
      name: '퇴고 — 이 초안 다듬기',
      callback: () => {
        void proposeRevisionCommand(this);
      }
    });

    this.addCommand({
      id: 'propose-manuscript',
      name: '원고 조립 — 이 퇴고/초안을 최종 원고로',
      callback: () => {
        void proposeManuscriptCommand(this);
      }
    });

    this.addSettingTab(new OmwSettingTab(this.app, this));
  }

  onunload(): void {}

  async loadSettings(): Promise<void> {
    const raw = ((await this.loadData()) ?? {}) as Record<string, unknown>;
    const hadApiKey = Object.prototype.hasOwnProperty.call(raw, 'apiKey');
    const legacyKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '';
    if (legacyKey !== '' && !hasSavedKey()) {
      try {
        saveLocalKey(legacyKey);
      } catch (error) {
        new Notice('기존 Claude 키를 이 PC로 옮기지 못했습니다. 플러그인 설정에서 키를 다시 입력하세요.');
      }
    }
    if (hadApiKey) {
      delete raw.apiKey;
    }
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
    if (hadApiKey) {
      await this.saveData(this.settings);
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
