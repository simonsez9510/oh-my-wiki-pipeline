import { App, PluginSettingTab, Setting } from 'obsidian';
import type OmwPipelinePlugin from './main';
import { loadLocalKey, saveLocalKey } from './secret';

export interface OmwSettings {
  model: string;
  beatFolder: string;
  expectedVaultPath: string;
}

export const DEFAULT_SETTINGS: OmwSettings = {
  model: 'claude-opus-4-8',
  beatFolder: '',
  expectedVaultPath: ''
};

export class OmwSettingTab extends PluginSettingTab {
  private readonly plugin: OmwPipelinePlugin;

  constructor(app: App, plugin: OmwPipelinePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Claude API 키')
      .setDesc('Anthropic API 키. 이 PC에만 저장되며(홈 폴더), vault·Drive·다른 PC와 동기화/공유되지 않습니다. 공유 vault에서도 각자 자기 키를 쓰세요.')
      .addText((text) => {
        text
          .setPlaceholder('sk-ant-...')
          .setValue(loadLocalKey())
          .onChange((value) => {
            saveLocalKey(value);
          });
        text.inputEl.type = 'password';
      });

    new Setting(containerEl)
      .setName('모델')
      .setDesc('비트 제안에 사용할 Claude 모델.')
      .addText((text) =>
        text
          .setPlaceholder('claude-opus-4-8')
          .setValue(this.plugin.settings.model)
          .onChange(async (value) => {
            this.plugin.settings.model = value.trim() || DEFAULT_SETTINGS.model;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('비트 노트 폴더')
      .setDesc('비워두면 현재 장 노트와 같은 폴더에 저장합니다.')
      .addText((text) =>
        text
          .setPlaceholder('(현재 장 폴더)')
          .setValue(this.plugin.settings.beatFolder)
          .onChange(async (value) => {
            this.plugin.settings.beatFolder = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('정본 vault 경로 (선택)')
      .setDesc('설정하면 활성 vault 경로가 다를 때 저장을 중단합니다 (OneDrive 사본 등 오기록 방지). 비워두면 가드 없음.')
      .addText((text) =>
        text
          .setPlaceholder('G:\\내 드라이브\\my-vault')
          .setValue(this.plugin.settings.expectedVaultPath)
          .onChange(async (value) => {
            this.plugin.settings.expectedVaultPath = value.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
