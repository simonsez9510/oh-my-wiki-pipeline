import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const KEY_DIR = join(homedir(), '.oh-my-wiki-pipeline');
const KEY_FILE = join(KEY_DIR, 'apikey.txt');

export function getKeyPath(): string {
  return KEY_FILE;
}

export function loadSavedKey(): string {
  try {
    if (existsSync(KEY_FILE)) {
      return readFileSync(KEY_FILE, 'utf8').trim();
    }
  } catch (error) {
    return '';
  }
  return '';
}

export function hasSavedKey(): boolean {
  return loadSavedKey() !== '';
}

export function loadLocalKey(): string {
  const fromFile = loadSavedKey();
  if (fromFile !== '') {
    return fromFile;
  }
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  return typeof fromEnv === 'string' ? fromEnv.trim() : '';
}

export function saveLocalKey(key: string): void {
  const trimmed = key.trim();
  mkdirSync(KEY_DIR, { recursive: true });
  writeFileSync(KEY_FILE, trimmed, { encoding: 'utf8', mode: 0o600 });
}
