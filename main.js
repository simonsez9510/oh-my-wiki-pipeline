"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => OmwPipelinePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian11 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");

// src/secret.ts
var import_os = require("os");
var import_path = require("path");
var import_fs = require("fs");
var KEY_DIR = (0, import_path.join)((0, import_os.homedir)(), ".oh-my-wiki-pipeline");
var KEY_FILE = (0, import_path.join)(KEY_DIR, "apikey.txt");
function loadSavedKey() {
  try {
    if ((0, import_fs.existsSync)(KEY_FILE)) {
      return (0, import_fs.readFileSync)(KEY_FILE, "utf8").trim();
    }
  } catch (error) {
    return "";
  }
  return "";
}
function hasSavedKey() {
  return loadSavedKey() !== "";
}
function loadLocalKey() {
  const fromFile = loadSavedKey();
  if (fromFile !== "") {
    return fromFile;
  }
  const fromEnv = process.env.ANTHROPIC_API_KEY;
  return typeof fromEnv === "string" ? fromEnv.trim() : "";
}
function saveLocalKey(key) {
  const trimmed = key.trim();
  (0, import_fs.mkdirSync)(KEY_DIR, { recursive: true });
  (0, import_fs.writeFileSync)(KEY_FILE, trimmed, { encoding: "utf8", mode: 384 });
}

// src/settings.ts
var DEFAULT_SETTINGS = {
  model: "claude-opus-4-8",
  beatFolder: "",
  expectedVaultPath: ""
};
var OmwSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Claude API \uD0A4").setDesc("Anthropic API \uD0A4. \uC774 PC\uC5D0\uB9CC \uC800\uC7A5\uB418\uBA70(\uD648 \uD3F4\uB354), vault\xB7Drive\xB7\uB2E4\uB978 PC\uC640 \uB3D9\uAE30\uD654/\uACF5\uC720\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACF5\uC720 vault\uC5D0\uC11C\uB3C4 \uAC01\uC790 \uC790\uAE30 \uD0A4\uB97C \uC4F0\uC138\uC694.").addText((text) => {
      text.setPlaceholder("sk-ant-...").setValue(loadLocalKey()).onChange((value) => {
        saveLocalKey(value);
      });
      text.inputEl.type = "password";
    });
    new import_obsidian.Setting(containerEl).setName("\uBAA8\uB378").setDesc("\uBE44\uD2B8 \uC81C\uC548\uC5D0 \uC0AC\uC6A9\uD560 Claude \uBAA8\uB378.").addText(
      (text) => text.setPlaceholder("claude-opus-4-8").setValue(this.plugin.settings.model).onChange(async (value) => {
        this.plugin.settings.model = value.trim() || DEFAULT_SETTINGS.model;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\uBE44\uD2B8 \uB178\uD2B8 \uD3F4\uB354").setDesc("\uBE44\uC6CC\uB450\uBA74 \uD604\uC7AC \uC7A5 \uB178\uD2B8\uC640 \uAC19\uC740 \uD3F4\uB354\uC5D0 \uC800\uC7A5\uD569\uB2C8\uB2E4.").addText(
      (text) => text.setPlaceholder("(\uD604\uC7AC \uC7A5 \uD3F4\uB354)").setValue(this.plugin.settings.beatFolder).onChange(async (value) => {
        this.plugin.settings.beatFolder = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\uC815\uBCF8 vault \uACBD\uB85C (\uC120\uD0DD)").setDesc("\uC124\uC815\uD558\uBA74 \uD65C\uC131 vault \uACBD\uB85C\uAC00 \uB2E4\uB97C \uB54C \uC800\uC7A5\uC744 \uC911\uB2E8\uD569\uB2C8\uB2E4 (OneDrive \uC0AC\uBCF8 \uB4F1 \uC624\uAE30\uB85D \uBC29\uC9C0). \uBE44\uC6CC\uB450\uBA74 \uAC00\uB4DC \uC5C6\uC74C.").addText(
      (text) => text.setPlaceholder("G:\\\uB0B4 \uB4DC\uB77C\uC774\uBE0C\\my-vault").setValue(this.plugin.settings.expectedVaultPath).onChange(async (value) => {
        this.plugin.settings.expectedVaultPath = value.trim();
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/commands/proposeBeats.ts
var import_obsidian5 = require("obsidian");

// src/ai/beats.ts
var YEAR_PATTERN = /\b(1[89]\d{2}|20\d{2})\b/g;
var MIN_QUOTE_LENGTH = 8;
function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}
function extractYears(text) {
  var _a;
  return [...new Set((_a = text.match(YEAR_PATTERN)) != null ? _a : [])];
}
function normalizeLanguage(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "ru" || normalized === "russian" || normalized === "\uB7EC\uC2DC\uC544\uC5B4" || normalized === "\u0440\u0443\u0441\u0441\u043A\u0438\u0439") {
      return "ru";
    }
  }
  return "ko";
}
function languageDirective(language, task) {
  if (language !== "ru") {
    return "";
  }
  if (task === "beat") {
    return " \uCD9C\uB825 \uC5B8\uC5B4: \uB7EC\uC2DC\uC544\uC5B4. title\uACFC line\uC744 \uB7EC\uC2DC\uC544\uC5B4\uB85C \uC791\uC131\uD558\uB77C. sources(\uCE74\uB4DC \uC81C\uBAA9)\uB294 \uC808\uB300 \uBC88\uC5ED\xB7\uBCC0\uACBD\uD558\uC9C0 \uB9D0\uACE0 \uC6D0\uBB38 \uADF8\uB300\uB85C \uB450\uBA70, quote\uB294 \uC778\uC6A9 \uCE74\uB4DC \uADFC\uAC70\uC5D0\uC11C \uADF8\uB300\uB85C \uBCF5\uC0AC\uD55C\uB2E4(\uC5B8\uC5B4 \uBD88\uBB38).";
  }
  if (task === "draft") {
    return " \uCD9C\uB825 \uC5B8\uC5B4: \uB7EC\uC2DC\uC544\uC5B4. prose\uB9CC \uB7EC\uC2DC\uC544\uC5B4\uB85C \uC791\uC131\uD558\uB77C. beatTitle\uC740 \uC8FC\uC5B4\uC9C4 \uBE44\uD2B8 \uC81C\uBAA9\uACFC \uC815\uD655\uD788 \uC77C\uCE58\uC2DC\uD0A4\uACE0(\uC808\uB300 \uBC88\uC5ED \uAE08\uC9C0), sources(\uCE74\uB4DC \uC81C\uBAA9)\uB3C4 \uC6D0\uBB38 \uADF8\uB300\uB85C \uB454\uB2E4.";
  }
  return " \uCD9C\uB825 \uC5B8\uC5B4: \uB7EC\uC2DC\uC544\uC5B4. \uB2E4\uB4EC\uC740 prose\uB97C \uB7EC\uC2DC\uC544\uC5B4\uB85C \uC791\uC131\uD558\uB77C. index\uB294 \uADF8\uB300\uB85C \uB454\uB2E4.";
}
function beatToolSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["beats"],
    properties: {
      beats: {
        type: "array",
        minItems: 3,
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "line", "quote", "sources"],
          properties: {
            title: { type: "string", description: "\uBE44\uD2B8\uC758 \uC9E7\uC740 \uC81C\uBAA9" },
            line: { type: "string", description: "\uC774 \uC7A5\uBA74\uC774 \uCE60 \uAD6C\uCCB4\uC801 \uC21C\uAC04 \uD55C \uC904" },
            quote: {
              type: "string",
              minLength: MIN_QUOTE_LENGTH,
              description: "\uC778\uC6A9\uD55C \uC790\uB8CC\uC870\uC0AC \uCE74\uB4DC\uC758 \uADFC\uAC70\uC5D0\uC11C \uADF8\uB300\uB85C \uBCF5\uC0AC\uD55C \uC6D0\uBB38 \uAD6C\uC808(\uCD5C\uC18C 8\uC790). \uC9C0\uC5B4\uB0B4\uC9C0 \uB9D0\uACE0 \uCE74\uB4DC \uC6D0\uBB38\uC744 \uBCF5\uC0AC\uD560 \uAC83."
            },
            sources: {
              type: "array",
              items: { type: "string" },
              description: "\uC774 \uBE44\uD2B8\uC758 \uADFC\uAC70\uAC00 \uB418\uB294 \uC790\uB8CC\uC870\uC0AC \uCE74\uB4DC\uC758 \uC815\uD655\uD55C \uC81C\uBAA9\uB9CC. \uCE74\uB4DC\uC5D0 \uC5C6\uB294 \uC81C\uBAA9\xB7\uC0AC\uC2E4\uC744 \uC9C0\uC5B4\uB0B4\uC9C0 \uB9D0 \uAC83."
            }
          }
        }
      }
    }
  };
}
function buildBeatMessages(input) {
  const cards = input.cards.map((card) => ({ title: card.title, summary: card.summary, evidence: card.evidence }));
  return {
    system: "\uB2F9\uC2E0\uC740 \uD55C\uAD6D\uC5B4 \uCC45 \uC9D1\uD544\uC758 \uD3B8\uC9D1 \uC870\uAD50\uB2E4. \uC800\uC790\uAC00 \uC544\uB2C8\uB77C \uC870\uAD50\uB85C \uB3D9\uC791\uD55C\uB2E4. \uC8FC\uC5B4\uC9C4 \uC7A5(\uBAA9\uCC28)\uACFC \uC790\uB8CC\uC870\uC0AC \uCE74\uB4DC\uB97C \uADFC\uAC70\uB85C, \uADF8 \uC7A5\uC5D0\uC11C \uCE60 \uAD6C\uCCB4\uC801 \uBE44\uD2B8(\uC7A5\uBA74\xB7\uC21C\uAC04)\uC758 \uC2DC\uD2B8\uB97C \uC81C\uC548\uD55C\uB2E4. \uBE44\uD2B8 = \uD55C \uC7A5\uBA74\uC774 \uCE60 \uAD6C\uCCB4\uC801 \uC21C\uAC04 \uD55C \uC904. \uB3C4\uAD6C\uB97C \uC815\uD655\uD788 \uD55C \uBC88\uB9CC \uD638\uCD9C\uD55C\uB2E4. \uC8FC\uC5B4\uC9C4 \uC7A5\uACFC \uCE74\uB4DC\uC5D0 \uBA85\uC2DC\uB41C \uC0AC\uC2E4\uB9CC \uC0AC\uC6A9\uD558\uACE0, \uCE74\uB4DC/\uC7A5\uC5D0 \uC5C6\uB294 \uC5F0\uB3C4\xB7\uC778\uBA85\xB7\uC7A5\uC18C\xB7\uC0AC\uAC74\uC744 \uC808\uB300 \uC9C0\uC5B4\uB0B4\uC9C0 \uB9C8\uB77C. \uAC01 \uBE44\uD2B8\uB294 \uBC18\uB4DC\uC2DC 1\uAC1C \uC774\uC0C1\uC758 \uCE74\uB4DC\uB97C sources\uB85C \uC778\uC6A9\uD558\uACE0, quote\uC5D0\uB294 \uADF8 \uCE74\uB4DC \uADFC\uAC70(evidence)\uC5D0\uC11C \uADF8\uB300\uB85C \uBCF5\uC0AC\uD55C \uC6D0\uBB38 \uAD6C\uC808\uC744 \uB123\uC5B4\uB77C." + languageDirective(input.language, "beat"),
    user: JSON.stringify({
      instruction: "\uC544\uB798 \uC7A5\uACFC \uCE74\uB4DC\uB85C 3~8\uAC1C\uC758 \uBE44\uD2B8\uB97C \uC11C\uC0AC \uC21C\uC11C\uB85C \uC81C\uC548\uD558\uB77C. \uAC01 \uBE44\uD2B8\uB294 {title, line, quote, sources}. sources\uB294 \uC704 \uCE74\uB4DC\uB4E4\uC758 \uC815\uD655\uD55C \uC81C\uBAA9\uB9CC, quote\uB294 \uADF8 \uCE74\uB4DC evidence\uC758 \uC6D0\uBB38 \uBCF5\uC0AC(\uCD5C\uC18C 8\uC790).",
      chapter: { title: input.chapterTitle, body: input.chapterBody },
      cards,
      ...input.feedback && input.feedback.trim() !== "" ? { revisionFeedback: input.feedback.trim() } : {}
    })
  };
}
function evaluateBeat(draft, input, cardByTitle) {
  const title = draft.title.trim();
  const line = draft.line.trim();
  const quote = draft.quote.trim();
  if (title === "" || line === "") {
    return null;
  }
  const sources = [...new Set(draft.sources.filter((value) => cardByTitle.has(value)))];
  const citedCards = sources.map((src) => cardByTitle.get(src)).filter((card) => card !== void 0);
  const citedCardText = collapseWhitespace(citedCards.map((card) => `${card.summary} ${card.evidence}`).join(" "));
  const yearText = collapseWhitespace([input.chapterBody, citedCardText].join(" "));
  const citedYears = new Set(extractYears(yearText));
  const flags = [];
  let blocking = false;
  if (sources.length === 0) {
    flags.push("\uCD9C\uCC98 \uC5C6\uC74C \u2014 \uADFC\uAC70 \uCE74\uB4DC\uB97C \uC5F0\uACB0\uD558\uC138\uC694 (\uC800\uC7A5 \uBD88\uAC00)");
    blocking = true;
  }
  const novelYears = extractYears(line).filter((year) => !citedYears.has(year));
  if (novelYears.length > 0) {
    flags.push(`\uC6D0\uBB38\uC5D0 \uC5C6\uB294 \uC5F0\uB3C4(${novelYears.join(", ")}) \u2014 \uC0AC\uC2E4 \uD655\uC778 \uD544\uC694`);
  }
  const normalizedQuote = collapseWhitespace(quote);
  if (normalizedQuote === "") {
    flags.push("\uADFC\uAC70 \uAD6C\uC808 \uC5C6\uC74C \u2014 \uCE74\uB4DC \uC6D0\uBB38\uC5D0\uC11C \uC778\uC6A9\uD558\uC138\uC694");
  } else if (normalizedQuote.length < MIN_QUOTE_LENGTH) {
    flags.push("\uADFC\uAC70 \uAD6C\uC808\uC774 \uB108\uBB34 \uC9E7\uC74C \u2014 \uCE74\uB4DC \uC6D0\uBB38\uC744 \uCDA9\uBD84\uD788 \uC778\uC6A9\uD558\uC138\uC694");
  } else if (!citedCardText.includes(normalizedQuote)) {
    flags.push("\uADFC\uAC70 \uAD6C\uC808\uC744 \uCE74\uB4DC\uC5D0\uC11C \uCC3E\uC744 \uC218 \uC5C6\uC74C \u2014 \uC9C0\uC5B4\uB0C8\uC744 \uC218 \uC788\uC74C");
  }
  return { title, line, quote, sources, flags, blocking };
}
function normalizeBeats(input, raw) {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const rawBeats = raw && typeof raw === "object" && Array.isArray(raw.beats) ? raw.beats : [];
  const result = [];
  for (const entry of rawBeats) {
    const beat = entry != null ? entry : {};
    const draft = {
      title: typeof beat.title === "string" ? beat.title : "",
      line: typeof beat.line === "string" ? beat.line : "",
      quote: typeof beat.quote === "string" ? beat.quote : "",
      sources: Array.isArray(beat.sources) ? beat.sources.filter((value) => typeof value === "string") : []
    };
    const evaluated = evaluateBeat(draft, input, cardByTitle);
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}
function revalidateBeats(beats, input) {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const result = [];
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
function selectSavableBeats(beats, cards) {
  const cardByTitle = new Map(cards.map((card) => [card.title, card]));
  const result = [];
  for (const beat of beats) {
    if (beat.title.trim() === "" || beat.line.trim() === "") {
      continue;
    }
    const sourceCards = beat.sources.map((title) => cardByTitle.get(title)).filter((card) => card !== void 0);
    if (beat.blocking || sourceCards.length === 0) {
      continue;
    }
    result.push({ beat, sourceCards });
  }
  return result;
}

// src/ai/client.ts
var import_obsidian2 = require("obsidian");

// src/ai/draft.ts
function collapseWhitespace2(text) {
  return text.replace(/\s+/g, " ").trim();
}
function draftToolSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["sections"],
    properties: {
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 30,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["beatTitle", "prose", "sources"],
          properties: {
            beatTitle: { type: "string", description: "\uC774 \uC0B0\uBB38\uC774 \uC0B4\uC744 \uBD99\uC774\uB294 \uC2B9\uC778\uB41C \uBE44\uD2B8\uC758 \uC81C\uBAA9(\uC815\uD655\uD788 \uC77C\uCE58)" },
            prose: { type: "string", description: "\uADF8 \uBE44\uD2B8\uB97C \uD3BC\uCE5C \uC0B0\uBB38 \uB2E8\uB77D (\uCD9C\uB825 \uC5B8\uC5B4 \uC9C0\uC2DC\uC5D0 \uB530\uB984)" },
            sources: {
              type: "array",
              items: { type: "string" },
              description: "\uC774 \uB2E8\uB77D\uC758 \uADFC\uAC70 \uCE74\uB4DC \uC81C\uBAA9 \u2014 \uBC18\uB4DC\uC2DC \uD574\uB2F9 \uBE44\uD2B8\uC758 sources \uC911\uC5D0\uC11C\uB9CC"
            }
          }
        }
      }
    }
  };
}
function buildDraftMessages(input) {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const beats = input.beats.map((beat) => ({
    title: beat.title,
    line: beat.line,
    sources: beat.sources,
    evidence: beat.sources.map((title) => {
      const card = cardByTitle.get(title);
      return card ? `${card.summary} ${card.evidence}`.trim() : "";
    }).filter((text) => text !== "")
  }));
  return {
    system: "\uB2F9\uC2E0\uC740 \uD55C\uAD6D\uC5B4 \uCC45\uC758 \uC9D1\uD544 \uC870\uAD50\uB2E4. \uC800\uC790\uAC00 \uC544\uB2C8\uB77C \uC870\uAD50\uB2E4. \uC2B9\uC778\uB41C \uBE44\uD2B8(\uC7A5\uBA74 \uBF08\uB300)\uB4E4\uC744 \uBC1B\uC544 \uAC01\uAC01\uC744 \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uC0B0\uBB38 \uB2E8\uB77D\uC73C\uB85C \uD3BC\uCE5C\uB2E4. \uBE44\uD2B8\uC758 \uC21C\uC11C\uB97C \uC720\uC9C0\uD558\uACE0, \uBE44\uD2B8\uB9C8\uB2E4 \uC815\uD655\uD788 \uD55C \uB2E8\uB77D\uC744 \uC4F4\uB2E4. \uB3C4\uAD6C\uB97C \uC815\uD655\uD788 \uD55C \uBC88 \uD638\uCD9C\uD55C\uB2E4. \uAC01 \uBE44\uD2B8\uC758 line\uACFC \uADF8 \uBE44\uD2B8\uAC00 \uC778\uC6A9\uD55C \uCE74\uB4DC \uADFC\uAC70(evidence)\uC5D0 \uC788\uB294 \uC0AC\uC2E4\uB9CC\uC73C\uB85C \uC0B0\uBB38\uC744 \uC368\uB77C. \uBE44\uD2B8\xB7\uCE74\uB4DC\uC5D0 \uC5C6\uB294 \uC0AC\uC2E4\xB7\uC5F0\uB3C4\xB7\uC778\uBA85\xB7\uC7A5\uC18C\uB97C \uC808\uB300 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uB9C8\uB77C. \uBD88\uD655\uC2E4\uD558\uBA74 \uB2E8\uC815\uD558\uC9C0 \uB9D0\uACE0 \uADF8 \uCDE8\uC9C0\uB97C \uB4DC\uB7EC\uB0B4\uB77C. \uAC01 \uB2E8\uB77D\uC740 \uD574\uB2F9 \uBE44\uD2B8\uC758 sources\uB9CC \uC778\uC6A9\uD55C\uB2E4." + languageDirective(input.language, "draft"),
    user: JSON.stringify({
      instruction: "\uC544\uB798 \uC2B9\uC778\uB41C \uBE44\uD2B8\uB4E4\uC744 \uC21C\uC11C\uB300\uB85C \uAC01\uAC01 \uC0B0\uBB38 \uB2E8\uB77D\uC73C\uB85C \uD3BC\uCCD0\uB77C(\uCD9C\uB825 \uC5B8\uC5B4\uB294 \uC2DC\uC2A4\uD15C \uC9C0\uC2DC\uB97C \uB530\uB978\uB2E4). \uAC01 \uD56D\uBAA9\uC740 {beatTitle, prose, sources}. beatTitle\uC740 \uC544\uB798 \uBE44\uD2B8 \uC81C\uBAA9\uACFC \uC815\uD655\uD788 \uC77C\uCE58, sources\uB294 \uADF8 \uBE44\uD2B8\uC758 sources \uC911\uC5D0\uC11C\uB9CC.",
      chapter: input.chapterTitle,
      beats,
      ...input.feedback && input.feedback.trim() !== "" ? { revisionFeedback: input.feedback.trim() } : {}
    })
  };
}
function evaluateSection(draft, beatByTitle, cardByTitle) {
  const beatTitle = draft.beatTitle.trim();
  const prose = draft.prose.trim();
  if (prose === "") {
    return null;
  }
  const beat = beatByTitle.get(beatTitle);
  if (!beat) {
    return null;
  }
  const allowed = new Set(beat.sources);
  const sources = [...new Set(draft.sources.filter((title) => allowed.has(title) && cardByTitle.has(title)))];
  const citedText = collapseWhitespace2(
    [beat.line, ...sources.map((title) => {
      const card = cardByTitle.get(title);
      return card ? `${card.summary} ${card.evidence}` : "";
    })].join(" ")
  );
  const citedYears = new Set(extractYears(citedText));
  const flags = [];
  let blocking = false;
  if (sources.length === 0) {
    flags.push("\uCD9C\uCC98 \uC5C6\uC74C \u2014 \uBE44\uD2B8\uC758 \uADFC\uAC70 \uCE74\uB4DC\uB97C \uC5F0\uACB0\uD558\uC138\uC694 (\uC800\uC7A5 \uBD88\uAC00)");
    blocking = true;
  }
  const novelYears = extractYears(prose).filter((year) => !citedYears.has(year));
  if (novelYears.length > 0) {
    flags.push(`\uBE44\uD2B8\xB7\uCE74\uB4DC\uC5D0 \uC5C6\uB294 \uC5F0\uB3C4(${novelYears.join(", ")}) \u2014 \uC0AC\uC2E4 \uD655\uC778 \uD544\uC694`);
  }
  return { beatTitle, prose, sources, flags, blocking };
}
function normalizeDraftSections(input, raw) {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const rawSections = raw && typeof raw === "object" && Array.isArray(raw.sections) ? raw.sections : [];
  const result = [];
  for (const entry of rawSections) {
    const section = entry != null ? entry : {};
    const draft = {
      beatTitle: typeof section.beatTitle === "string" ? section.beatTitle : "",
      prose: typeof section.prose === "string" ? section.prose : "",
      sources: Array.isArray(section.sources) ? section.sources.filter((value) => typeof value === "string") : []
    };
    const evaluated = evaluateSection(draft, beatByTitle, cardByTitle);
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}
function revalidateDraftSections(sections, input) {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const result = [];
  for (const section of sections) {
    const evaluated = evaluateSection(
      { beatTitle: section.beatTitle, prose: section.prose, sources: section.sources },
      beatByTitle,
      cardByTitle
    );
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}
function selectSavableDraftSections(sections, input) {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const result = [];
  for (const section of sections) {
    if (section.prose.trim() === "") {
      continue;
    }
    const beat = beatByTitle.get(section.beatTitle);
    if (!beat) {
      continue;
    }
    const allowed = new Set(beat.sources);
    const sourceCards = section.sources.filter((title) => allowed.has(title)).map((title) => cardByTitle.get(title)).filter((card) => card !== void 0);
    if (section.blocking || sourceCards.length === 0) {
      continue;
    }
    result.push({ section, beat, sourceCards });
  }
  return result;
}

// src/ai/revise.ts
var REVISION_YEAR_FLAG_PREFIX = "\uCD08\uC548\uC5D0 \uC5C6\uB294 \uC5F0\uB3C4";
function revisionYearFlag(years) {
  return `${REVISION_YEAR_FLAG_PREFIX}(${years.join(", ")}) \u2014 \uD1F4\uACE0\uAC00 \uCD94\uAC00\uD568, \uC0AC\uC2E4 \uD655\uC778 \uD544\uC694`;
}
function draftAllowedYears(sections) {
  return new Set(sections.flatMap((section) => extractYears(section.prose)));
}
function reviseToolSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["sections"],
    properties: {
      sections: {
        type: "array",
        minItems: 1,
        maxItems: 60,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["index", "prose"],
          properties: {
            index: { type: "integer", description: "\uB2E4\uB4EC\uC744 \uC6D0\uBCF8 \uB2E8\uB77D\uC758 \uBC88\uD638(0\uBD80\uD130)" },
            prose: { type: "string", description: "\uB2E4\uB4EC\uC740 \uC0B0\uBB38 \uB2E8\uB77D (\uCD9C\uB825 \uC5B8\uC5B4 \uC9C0\uC2DC\uC5D0 \uB530\uB984)" }
          }
        }
      }
    }
  };
}
function buildReviseMessages(input) {
  return {
    system: "\uB2F9\uC2E0\uC740 \uD55C\uAD6D\uC5B4 \uCC45\uC758 \uD1F4\uACE0 \uD3B8\uC9D1\uC790\uB2E4. \uC8FC\uC5B4\uC9C4 \uCD08\uC548 \uB2E8\uB77D\uB4E4\uC744 \uB354 \uC790\uC5F0\uC2A4\uB7FD\uACE0 \uB9AC\uB4EC \uC788\uAC8C \uB2E4\uB4EC\uB418, \uC0C8\uB85C\uC6B4 \uC0AC\uC2E4\xB7\uC5F0\uB3C4\xB7\uC778\uBA85\xB7\uC7A5\uC18C\xB7\uC0AC\uAC74\uC744 \uC808\uB300 \uCD94\uAC00\uD558\uC9C0 \uB9C8\uB77C. \uC6D0\uBB38\uC758 \uC0AC\uC2E4\uACFC \uC758\uBBF8\uB97C \uBCF4\uC874\uD558\uACE0, \uCD9C\uCC98\uB294 \uBC14\uAFB8\uC9C0 \uC54A\uB294\uB2E4. \uAC01 \uB2E8\uB77D\uC744 \uAC19\uC740 \uBC88\uD638(index)\uB85C \uB3CC\uB824\uC900\uB2E4. \uB3C4\uAD6C\uB97C \uC815\uD655\uD788 \uD55C \uBC88 \uD638\uCD9C\uD55C\uB2E4." + languageDirective(input.language, "revise"),
    user: JSON.stringify({
      instruction: "\uC544\uB798 \uBC88\uD638\uAC00 \uB9E4\uACA8\uC9C4 \uCD08\uC548 \uB2E8\uB77D\uB4E4\uC744 \uAC01\uAC01 \uB2E4\uB4EC\uC5B4\uB77C. \uAC01 \uD56D\uBAA9\uC740 {index, prose}. index\uB294 \uC6D0\uBCF8 \uADF8\uB300\uB85C \uB450\uACE0, prose\uB294 \uB2E4\uB4EC\uC740 \uAE00. \uC0AC\uC2E4\xB7\uC5F0\uB3C4\xB7\uACE0\uC720\uBA85\uC0AC\uB97C \uC0C8\uB85C \uCD94\uAC00\uD558\uC9C0 \uB9C8\uB77C.",
      chapter: input.chapterTitle,
      sections: input.sections.map((section, index) => ({ index, prose: section.prose })),
      ...input.feedback && input.feedback.trim() !== "" ? { revisionFeedback: input.feedback.trim() } : {}
    })
  };
}
function normalizeRevisions(input, raw) {
  const rawSections = raw && typeof raw === "object" && Array.isArray(raw.sections) ? raw.sections : [];
  const revisedByIndex = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const entry of rawSections) {
    const section = entry != null ? entry : {};
    const index = typeof section.index === "number" ? section.index : Number.NaN;
    if (!Number.isInteger(index) || index < 0 || index >= input.sections.length) {
      continue;
    }
    if (seen.has(index)) {
      revisedByIndex.delete(index);
      continue;
    }
    seen.add(index);
    const prose = typeof section.prose === "string" ? section.prose.trim() : "";
    if (prose !== "") {
      revisedByIndex.set(index, prose);
    }
  }
  const allowedYears = draftAllowedYears(input.sections);
  const result = [];
  input.sections.forEach((original, index) => {
    const revised = revisedByIndex.get(index);
    const prose = revised && revised !== "" ? revised : original.prose;
    if (prose.trim() === "") {
      return;
    }
    const flags = [...original.flags];
    const novelYears = extractYears(prose).filter((year) => !allowedYears.has(year));
    if (novelYears.length > 0) {
      flags.push(revisionYearFlag(novelYears));
    }
    result.push({ prose, grounding: original.grounding, flags: [...new Set(flags)] });
  });
  return result;
}
function revalidateRevisedSections(sections, allowedYears) {
  const result = [];
  for (const section of sections) {
    if (section.prose.trim() === "") {
      continue;
    }
    const keptFlags = section.flags.filter((flag) => !flag.startsWith(REVISION_YEAR_FLAG_PREFIX));
    const novelYears = extractYears(section.prose).filter((year) => !allowedYears.has(year));
    const flags = novelYears.length > 0 ? [...keptFlags, revisionYearFlag(novelYears)] : keptFlags;
    result.push({ prose: section.prose, grounding: section.grounding, flags: [...new Set(flags)] });
  }
  return result;
}
function allowedYearsForRevision(sections) {
  return draftAllowedYears(sections);
}

// src/ai/client.ts
var ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
var ANTHROPIC_VERSION = "2023-06-01";
var REQUEST_TIMEOUT_MS = 12e4;
var MAX_TOKENS = 4096;
var AnthropicError = class extends Error {
};
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AnthropicError("Claude \uD638\uCD9C\uC774 \uC2DC\uAC04 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4 (2\uBD84). \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.")),
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
function extractToolInput(json, toolName) {
  const content = json && typeof json === "object" && Array.isArray(json.content) ? json.content : [];
  for (const block of content) {
    if (block && typeof block === "object" && block.type === "tool_use" && block.name === toolName) {
      return block.input;
    }
  }
  return null;
}
function extractApiError(response) {
  var _a;
  try {
    const json = response.json;
    const message = (_a = json == null ? void 0 : json.error) == null ? void 0 : _a.message;
    if (typeof message === "string" && message.trim() !== "") {
      return message.trim().slice(0, 300);
    }
  } catch (error) {
    return typeof response.text === "string" ? response.text.trim().slice(0, 300) : "";
  }
  return typeof response.text === "string" ? response.text.trim().slice(0, 300) : "";
}
async function callAnthropicTool(apiKey, model, system, user, toolName, schema) {
  if (apiKey.trim() === "") {
    throw new AnthropicError("Claude API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uD50C\uB7EC\uADF8\uC778 \uC124\uC815\uC5D0\uC11C \uD0A4\uB97C \uC785\uB825\uD558\uC138\uC694.");
  }
  const payload = {
    model,
    max_tokens: MAX_TOKENS,
    system,
    tools: [{ name: toolName, description: "\uACB0\uACFC\uB97C \uAE30\uB85D\uD55C\uB2E4.", input_schema: schema }],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: user }]
  };
  let response;
  try {
    response = await withTimeout(
      (0, import_obsidian2.requestUrl)({
        url: ANTHROPIC_URL,
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION
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
    throw new AnthropicError("Claude \uD638\uCD9C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB124\uD2B8\uC6CC\uD06C \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694.");
  }
  if (response.status >= 400) {
    const detail = extractApiError(response);
    const suffix = detail !== "" ? ` \u2014 ${detail}` : "";
    if (response.status === 401 || response.status === 403) {
      throw new AnthropicError(`Claude API \uD0A4\uAC00 \uAC70\uBD80\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD0A4\uB97C \uB2E4\uC2DC \uD655\uC778\uD558\uC138\uC694${suffix}`);
    }
    if (response.status === 429) {
      throw new AnthropicError(`\uC694\uCCAD\uC774 \uB9CE\uC544 \uAC70\uBD80\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694${suffix}`);
    }
    throw new AnthropicError(`Claude \uD638\uCD9C \uC624\uB958 (HTTP ${response.status})${suffix}`);
  }
  const toolInput = extractToolInput(response.json, toolName);
  if (toolInput === null) {
    throw new AnthropicError("Claude\uAC00 \uACB0\uACFC\uB97C \uBC18\uD658\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
  }
  return toolInput;
}
async function requestBeats(apiKey, model, input) {
  const { system, user } = buildBeatMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, "record_beats", beatToolSchema());
  return normalizeBeats(input, toolInput);
}
async function requestDraft(apiKey, model, input) {
  const { system, user } = buildDraftMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, "record_draft", draftToolSchema());
  return normalizeDraftSections(input, toolInput);
}
async function requestRevision(apiKey, model, input) {
  const { system, user } = buildReviseMessages(input);
  const toolInput = await callAnthropicTool(apiKey, model, system, user, "record_revision", reviseToolSchema());
  return normalizeRevisions(input, toolInput);
}

// src/ui/BeatApprovalModal.ts
var import_obsidian3 = require("obsidian");

// src/ui/beatListState.ts
var BeatListState = class {
  constructor(beats) {
    this.items = beats.map((beat) => ({ beat, accepted: !beat.blocking }));
  }
  toggle(index) {
    const item = this.items[index];
    if (!item || item.beat.blocking) {
      return;
    }
    item.accepted = !item.accepted;
  }
  move(index, direction) {
    const target = index + direction;
    if (index < 0 || index >= this.items.length || target < 0 || target >= this.items.length) {
      return;
    }
    const swapped = this.items[index];
    this.items[index] = this.items[target];
    this.items[target] = swapped;
  }
  setTitle(index, title) {
    const item = this.items[index];
    if (item) {
      item.beat = { ...item.beat, title };
    }
  }
  setLine(index, line) {
    const item = this.items[index];
    if (item) {
      item.beat = { ...item.beat, line };
    }
  }
  selected() {
    return this.items.filter((item) => item.accepted).map((item) => item.beat);
  }
};

// src/ui/BeatApprovalModal.ts
var BeatApprovalModal = class extends import_obsidian3.Modal {
  constructor(app, beats, callbacks) {
    super(app);
    this.state = new BeatListState(beats);
    this.callbacks = callbacks;
  }
  onOpen() {
    this.modalEl.addClass("omw-beat-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\uBE44\uD2B8 \uC81C\uC548 \u2014 \uC2B9\uC778 \uC804 \uBB34\uC800\uC7A5" });
    contentEl.createEl("p", {
      text: "\uCC44\uD0DD\uD560 \uBE44\uD2B8\uB97C \uACE0\uB974\uACE0, \uD544\uC694\uD558\uBA74 \uD3B8\uC9D1\xB7\uC7AC\uBC30\uC5F4\uD558\uC138\uC694. \uC2B9\uC778 \uC2DC \uCC44\uD0DD\uBD84\uB9CC vault\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4."
    });
    const list = contentEl.createDiv({ cls: "omw-beat-list" });
    this.state.items.forEach((item, index) => {
      const row = list.createDiv({ cls: "omw-beat-row" });
      if (!item.accepted) {
        row.addClass("omw-beat-rejected");
      }
      if (item.beat.flags.length > 0) {
        row.addClass("omw-beat-flagged");
      }
      const header = row.createDiv({ cls: "omw-beat-header" });
      const accept = header.createEl("input", { type: "checkbox" });
      accept.checked = item.accepted;
      accept.disabled = item.beat.blocking;
      accept.addEventListener("change", () => {
        this.state.toggle(index);
        this.render();
      });
      if (item.beat.blocking) {
        header.createEl("span", { cls: "omw-beat-blocked", text: "\uC800\uC7A5 \uBD88\uAC00" });
      }
      const titleInput = header.createEl("input", { type: "text", cls: "omw-beat-title" });
      titleInput.value = item.beat.title;
      titleInput.addEventListener("input", () => this.state.setTitle(index, titleInput.value));
      const up = header.createEl("button", { text: "\u2191" });
      up.addEventListener("click", () => {
        this.state.move(index, -1);
        this.render();
      });
      const down = header.createEl("button", { text: "\u2193" });
      down.addEventListener("click", () => {
        this.state.move(index, 1);
        this.render();
      });
      const lineInput = row.createEl("textarea", { cls: "omw-beat-line" });
      lineInput.value = item.beat.line;
      lineInput.rows = 2;
      lineInput.addEventListener("input", () => this.state.setLine(index, lineInput.value));
      const sources = item.beat.sources.length > 0 ? item.beat.sources.join(", ") : "(\uCD9C\uCC98 \uBBF8\uC5F0\uACB0)";
      row.createEl("div", { cls: "omw-beat-sources", text: `\uCD9C\uCC98: ${sources}` });
      for (const flag of item.beat.flags) {
        row.createEl("div", { cls: "omw-beat-flag", text: `\u26A0\uFE0F ${flag}` });
      }
    });
    const feedbackWrap = contentEl.createDiv({ cls: "omw-beat-feedback" });
    feedbackWrap.createEl("label", { text: "\uD53C\uB4DC\uBC31 \uC8FC\uACE0 \uB2E4\uC2DC \uC81C\uC548 (\uC120\uD0DD):" });
    const feedbackInput = feedbackWrap.createEl("textarea", { cls: "omw-beat-feedback-input" });
    feedbackInput.rows = 2;
    const footer = contentEl.createDiv({ cls: "omw-beat-footer" });
    const approve = footer.createEl("button", { text: "\uC2B9\uC778 \u2014 \uCC44\uD0DD\uBD84 \uC800\uC7A5", cls: "mod-cta" });
    approve.addEventListener("click", async () => {
      const selected = this.state.selected();
      this.close();
      await this.callbacks.onApprove(selected);
    });
    const regenerate = footer.createEl("button", { text: "\uD53C\uB4DC\uBC31\uC73C\uB85C \uB2E4\uC2DC \uC81C\uC548" });
    regenerate.addEventListener("click", async () => {
      const feedback = feedbackInput.value.trim();
      this.close();
      await this.callbacks.onRegenerate(feedback);
    });
    const cancel = footer.createEl("button", { text: "\uCDE8\uC18C" });
    cancel.addEventListener("click", () => this.close());
  }
};

// src/vault/serialize.ts
function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---")) {
    return markdown.trim();
  }
  const close = markdown.indexOf("\n---", 3);
  if (close === -1) {
    return markdown.trim();
  }
  const afterLine = markdown.indexOf("\n", close + 1);
  return (afterLine === -1 ? "" : markdown.slice(afterLine + 1)).trim();
}
function extractSection(markdown, heading) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const collected = [];
  let capturing = false;
  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      if (capturing) {
        break;
      }
      const title = headingMatch[1].trim();
      capturing = title === heading || title.startsWith(heading);
      continue;
    }
    if (capturing) {
      collected.push(line);
    }
  }
  return collected.join("\n").trim();
}
function firstParagraph(markdown) {
  for (const block of stripFrontmatter(markdown).split(/\r?\n\s*\r?\n/)) {
    const trimmed = block.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      return trimmed;
    }
  }
  return "";
}
function toResearchCard(title, path, markdown) {
  const summary = extractSection(markdown, "\uC694\uC57D") || firstParagraph(markdown);
  const evidence = extractSection(markdown, "\uC6D0\uBB38 \uADFC\uAC70") || extractSection(markdown, "\uADFC\uAC70");
  return { title, path, summary, evidence };
}
function parentDir(path) {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}
function disambiguateTitles(items) {
  var _a;
  const counts = /* @__PURE__ */ new Map();
  for (const item of items) {
    counts.set(item.title, ((_a = counts.get(item.title)) != null ? _a : 0) + 1);
  }
  return items.map((item) => {
    var _a2;
    if (((_a2 = counts.get(item.title)) != null ? _a2 : 0) <= 1) {
      return item;
    }
    const dir = item.path ? parentDir(item.path) : "";
    return dir === "" ? item : { ...item, title: `${item.title} (${dir})` };
  });
}
function disambiguateCardTitles(cards) {
  return disambiguateTitles(cards);
}
function wikiLink(linktext) {
  return `[[${linktext.replace(/[\r\n]+/g, " ").trim()}]]`;
}
function yamlScalar(value) {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
  return `"${escaped}"`;
}
function yamlBlockList(values) {
  if (values.length === 0) {
    return " []";
  }
  return `
${values.map((value) => `  - ${yamlScalar(value)}`).join("\n")}`;
}
function buildBeatNoteContent(beat, chapterLink, sourceLinks) {
  const frontmatter = [
    "page_type: beat",
    "stage: \uBE44\uD2B8",
    "status: \uC2B9\uC778",
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(sourceLinks.map(wikiLink))}`,
    `flags:${yamlBlockList(beat.flags)}`
  ].join("\n");
  const sourceLines = sourceLinks.length > 0 ? sourceLinks.map((link) => `- ${wikiLink(link)}`).join("\n") : "- (\uCD9C\uCC98 \uBBF8\uC5F0\uACB0)";
  const flagBlock = beat.flags.length > 0 ? `
## \uD655\uC778 \uD544\uC694
${beat.flags.map((flag) => `- \u26A0\uFE0F ${flag}`).join("\n")}` : "";
  const body = [`# ${beat.title}`, "", beat.line, "", "## \uCD9C\uCC98", sourceLines, flagBlock].join("\n").trimEnd();
  return `---
${frontmatter}
---

${body}
`;
}
function extractWikiLinks(value) {
  const links = [];
  const pattern = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let match = pattern.exec(value);
  while (match !== null) {
    links.push(match[1].trim());
    match = pattern.exec(value);
  }
  return links;
}
function extractWikiLink(value) {
  var _a;
  return (_a = extractWikiLinks(value)[0]) != null ? _a : null;
}
function parseBeatNote(markdown, basename) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  let title = basename.replace(/^비트 — /, "").trim();
  let line = "";
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^#\s+(.*)$/);
    if (heading) {
      title = heading[1].trim();
      bodyStart = i + 1;
      break;
    }
  }
  for (let i = bodyStart; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      continue;
    }
    if (trimmed.startsWith("#")) {
      break;
    }
    line = trimmed;
    break;
  }
  return { title, line };
}
function buildDraftNoteContent(chapterHeading, chapterLink, sections) {
  const allSources = [...new Set(sections.flatMap((section) => [section.beatLink, ...section.sourceLinks]))];
  const allFlags = [...new Set(sections.flatMap((section) => section.flags))];
  const frontmatter = [
    "page_type: draft",
    "stage: \uCD08\uC548",
    "status: \uC2B9\uC778",
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(allSources.map(wikiLink))}`,
    `flags:${yamlBlockList(allFlags)}`
  ].join("\n");
  const body = sections.map((section) => {
    const grounding = [section.beatLink, ...section.sourceLinks].map(wikiLink).join(" \xB7 ");
    const flagLines = section.flags.length > 0 ? `
${section.flags.map((flag) => `> \u26A0\uFE0F ${flag}`).join("\n")}` : "";
    return `${section.prose}

> \uADFC\uAC70: ${grounding}${flagLines}`;
  }).join("\n\n");
  return `---
${frontmatter}
---

# ${chapterHeading} (\uCD08\uC548)

${body}
`;
}
function parseDraftNote(markdown) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const sections = [];
  let prose = [];
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,6}\s/.test(trimmed)) {
      continue;
    }
    if (trimmed.startsWith("> \uADFC\uAC70:")) {
      const text = prose.join("\n").trim();
      prose = [];
      if (text !== "") {
        current = { prose: text, grounding: extractWikiLinks(trimmed), flags: [] };
        sections.push(current);
      } else {
        current = null;
      }
      continue;
    }
    if (trimmed.startsWith("> \u26A0\uFE0F")) {
      if (current) {
        current.flags.push(trimmed.replace(/^>\s*⚠️\s*/, "").trim());
      }
      continue;
    }
    if (trimmed.startsWith(">")) {
      continue;
    }
    prose.push(line);
  }
  return sections;
}
function buildRevisionNoteContent(chapterHeading, chapterLink, sections) {
  const allSources = [...new Set(sections.flatMap((section) => section.grounding))];
  const allFlags = [...new Set(sections.flatMap((section) => section.flags))];
  const frontmatter = [
    "page_type: revision",
    "stage: \uD1F4\uACE0",
    "status: \uC2B9\uC778",
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(allSources.map(wikiLink))}`,
    `flags:${yamlBlockList(allFlags)}`
  ].join("\n");
  const body = sections.map((section) => {
    const grounding = section.grounding.map(wikiLink).join(" \xB7 ");
    const flagLines = section.flags.length > 0 ? `
${section.flags.map((flag) => `> \u26A0\uFE0F ${flag}`).join("\n")}` : "";
    return `${section.prose}

> \uADFC\uAC70: ${grounding}${flagLines}`;
  }).join("\n\n");
  return `---
${frontmatter}
---

# ${chapterHeading} (\uD1F4\uACE0)

${body}
`;
}
function buildManuscriptNoteContent(chapterHeading, chapterLink, data) {
  const frontmatter = [
    "page_type: manuscript",
    "stage: \uC6D0\uACE0",
    "status: \uC2B9\uC778",
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `source_stage: ${yamlScalar(data.fromStage)}`,
    `assembled_from: ${yamlScalar(wikiLink(data.assembledFrom))}`,
    `sources:${yamlBlockList(data.sources.map(wikiLink))}`,
    `flags:${yamlBlockList(data.flags)}`
  ].join("\n");
  const proseBody = data.paragraphs.join("\n\n");
  const flagSection = data.flags.length > 0 ? `

## \uD655\uC778 \uD544\uC694
${data.flags.map((flag) => `- \u26A0\uFE0F ${flag.replace(/[\r\n]+/g, " ").trim()}`).join("\n")}` : "";
  return `---
${frontmatter}
---

# ${chapterHeading} (\uC6D0\uACE0)

${proseBody}${flagSection}
`;
}
function vaultPathMatches(basePath, expectedVaultPath) {
  const expected = expectedVaultPath.trim();
  if (expected === "") {
    return { ok: true };
  }
  if (basePath === null) {
    return { ok: false, reason: "vault \uACBD\uB85C\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4 \uC800\uC7A5\uC744 \uC911\uB2E8\uD569\uB2C8\uB2E4 (\uB370\uC2A4\uD06C\uD1B1 \uC804\uC6A9)." };
  }
  const normalize = (path) => path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  if (normalize(basePath) !== normalize(expected)) {
    return {
      ok: false,
      reason: `\uD65C\uC131 vault(${basePath})\uAC00 \uC124\uC815\uB41C \uC815\uBCF8 \uACBD\uB85C(${expected})\uC640 \uB2E4\uB985\uB2C8\uB2E4. \uC798\uBABB\uB41C \uC0AC\uBCF8\uC77C \uC218 \uC788\uC5B4 \uC800\uC7A5\uC744 \uC911\uB2E8\uD569\uB2C8\uB2E4.`
    };
  }
  return { ok: true };
}
function sanitizeVaultFolder(folder) {
  const trimmed = folder.trim().replace(/\\/g, "/");
  if (trimmed === "") {
    return "";
  }
  if (/^[a-zA-Z]:/.test(trimmed) || trimmed.startsWith("/")) {
    return null;
  }
  const segments = trimmed.split("/").filter((segment) => segment !== "");
  for (const segment of segments) {
    if (segment === ".." || segment === "." || segment.includes(":")) {
      return null;
    }
  }
  return segments.join("/");
}
function uniqueBasename(desired, existing) {
  const cleaned = desired.replace(/[\\/:*?"<>|#\[\]^]/g, " ").replace(/\s+/g, " ").trim() || "\uBE44\uD2B8";
  if (!existing.has(cleaned)) {
    return cleaned;
  }
  let suffix = 2;
  while (existing.has(`${cleaned} ${suffix}`)) {
    suffix += 1;
  }
  return `${cleaned} ${suffix}`;
}

// src/vault/notes.ts
var import_obsidian4 = require("obsidian");
function getVaultBasePath(app) {
  const adapter = app.vault.adapter;
  return adapter instanceof import_obsidian4.FileSystemAdapter ? adapter.getBasePath() : null;
}
function checkVaultGuard(app, expectedVaultPath) {
  return vaultPathMatches(getVaultBasePath(app), expectedVaultPath);
}
function isResearchCard(frontmatter) {
  if (!frontmatter) {
    return false;
  }
  return frontmatter.stage === "\uC790\uB8CC\uC870\uC0AC" || frontmatter.page_type === "wiki_card";
}
async function collectChapterContext(app, file) {
  var _a, _b;
  const raw = await app.vault.cachedRead(file);
  const cache = app.metadataCache.getFileCache(file);
  const cards = [];
  const seen = /* @__PURE__ */ new Set();
  for (const link of (_a = cache == null ? void 0 : cache.links) != null ? _a : []) {
    const dest = app.metadataCache.getFirstLinkpathDest(link.link, file.path);
    if (!dest || seen.has(dest.path)) {
      continue;
    }
    seen.add(dest.path);
    const frontmatter = (_b = app.metadataCache.getFileCache(dest)) == null ? void 0 : _b.frontmatter;
    if (!isResearchCard(frontmatter)) {
      continue;
    }
    const cardText = await app.vault.cachedRead(dest);
    cards.push(toResearchCard(dest.basename, dest.path, cardText));
  }
  return { title: file.basename, body: stripFrontmatter(raw), cards: disambiguateCardTitles(cards) };
}
function existingBasenames(app, folderPath) {
  var _a, _b;
  const target = folderPath === "" ? "/" : folderPath;
  const names = /* @__PURE__ */ new Set();
  for (const file of app.vault.getMarkdownFiles()) {
    const parentPath = (_b = (_a = file.parent) == null ? void 0 : _a.path) != null ? _b : "/";
    if (parentPath === target) {
      names.add(file.basename);
    }
  }
  return names;
}
function linkForPath(app, filePath, sourcePath) {
  const dest = app.vault.getAbstractFileByPath(filePath);
  return dest instanceof import_obsidian4.TFile ? app.metadataCache.fileToLinktext(dest, sourcePath, true) : filePath.replace(/\.md$/i, "");
}
function resolveLink(app, card, sourcePath) {
  return linkForPath(app, card.path, sourcePath);
}
async function saveBeatNotes(app, beats, chapterFile, cards, folder) {
  const savable = selectSavableBeats(beats, cards);
  if (savable.length === 0) {
    return [];
  }
  const dir = (0, import_obsidian4.normalizePath)(folder).replace(/^\/+$/, "");
  if (dir !== "" && !(app.vault.getAbstractFileByPath(dir) instanceof import_obsidian4.TFolder)) {
    await app.vault.createFolder(dir);
  }
  const existing = existingBasenames(app, dir);
  const created = [];
  for (const { beat, sourceCards } of savable) {
    const basename = uniqueBasename(`\uBE44\uD2B8 \u2014 ${beat.title}`, existing);
    existing.add(basename);
    const path = (0, import_obsidian4.normalizePath)(dir === "" ? `${basename}.md` : `${dir}/${basename}.md`);
    const chapterLink = app.metadataCache.fileToLinktext(chapterFile, path, true);
    const sourceLinks = sourceCards.map((card) => resolveLink(app, card, path));
    const content = buildBeatNoteContent(beat, chapterLink, sourceLinks);
    created.push(await app.vault.create(path, content));
  }
  return created;
}
function isApprovedBeatNote(frontmatter) {
  return (frontmatter == null ? void 0 : frontmatter.stage) === "\uBE44\uD2B8" && (frontmatter == null ? void 0 : frontmatter.status) === "\uC2B9\uC778";
}
async function collectApprovedBeats(app, chapterFile) {
  var _a, _b;
  const raws = [];
  const cardByPath = /* @__PURE__ */ new Map();
  for (const file of app.vault.getMarkdownFiles()) {
    const frontmatter = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
    if (!isApprovedBeatNote(frontmatter)) {
      continue;
    }
    const chapterRaw = typeof (frontmatter == null ? void 0 : frontmatter.chapter) === "string" ? extractWikiLink(frontmatter.chapter) : null;
    if (!chapterRaw) {
      continue;
    }
    const chapterDest = app.metadataCache.getFirstLinkpathDest(chapterRaw, file.path);
    if (!chapterDest || chapterDest.path !== chapterFile.path) {
      continue;
    }
    const body = await app.vault.cachedRead(file);
    const { title, line } = parseBeatNote(body, file.basename);
    const cardPaths = [];
    const frontmatterSources = Array.isArray(frontmatter == null ? void 0 : frontmatter.sources) ? frontmatter.sources : [];
    for (const rawSource of frontmatterSources) {
      for (const link of extractWikiLinks(String(rawSource))) {
        const dest = app.metadataCache.getFirstLinkpathDest(link, file.path);
        if (!dest) {
          continue;
        }
        const destFrontmatter = (_b = app.metadataCache.getFileCache(dest)) == null ? void 0 : _b.frontmatter;
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
  const beats = disambiguateTitles(
    raws.map((raw) => ({
      title: raw.title,
      line: raw.line,
      path: raw.path,
      sources: [...new Set(raw.cardPaths.map((cardPath) => titleByPath.get(cardPath)).filter((title) => title !== void 0))]
    }))
  );
  return { beats, cards };
}
async function saveDraftNote(app, sections, chapterFile, beats, cards, folder) {
  const savable = selectSavableDraftSections(sections, { chapterTitle: chapterFile.basename, beats, cards });
  if (savable.length === 0) {
    return null;
  }
  const dir = (0, import_obsidian4.normalizePath)(folder).replace(/^\/+$/, "");
  if (dir !== "" && !(app.vault.getAbstractFileByPath(dir) instanceof import_obsidian4.TFolder)) {
    await app.vault.createFolder(dir);
  }
  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`\uCD08\uC548 \u2014 ${chapterFile.basename}`, existing);
  const path = (0, import_obsidian4.normalizePath)(dir === "" ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = app.metadataCache.fileToLinktext(chapterFile, path, true);
  const noteSections = savable.map(({ section, beat, sourceCards }) => ({
    prose: section.prose,
    beatLink: beat.path ? linkForPath(app, beat.path, path) : beat.title,
    sourceLinks: sourceCards.map((card) => resolveLink(app, card, path)),
    flags: section.flags
  }));
  const content = buildDraftNoteContent(chapterFile.basename, chapterLink, noteSections);
  return app.vault.create(path, content);
}
function relinkText(app, linktext, fromPath, toPath) {
  const dest = app.metadataCache.getFirstLinkpathDest(linktext, fromPath);
  return dest instanceof import_obsidian4.TFile ? app.metadataCache.fileToLinktext(dest, toPath, true) : linktext;
}
async function readDraftForRevision(app, draftFile) {
  var _a;
  const body = await app.vault.cachedRead(draftFile);
  const sections = parseDraftNote(body);
  const frontmatter = (_a = app.metadataCache.getFileCache(draftFile)) == null ? void 0 : _a.frontmatter;
  const chapterRaw = typeof (frontmatter == null ? void 0 : frontmatter.chapter) === "string" ? extractWikiLink(frontmatter.chapter) : null;
  const chapterFile = chapterRaw ? app.metadataCache.getFirstLinkpathDest(chapterRaw, draftFile.path) : null;
  const chapterLinktext = chapterRaw != null ? chapterRaw : draftFile.basename;
  return { chapterFile, chapterLinktext, sections };
}
async function saveRevisionNote(app, sections, draftFile, chapterFile, chapterLinktext, folder) {
  var _a;
  const savable = sections.filter((section) => section.prose.trim() !== "");
  if (savable.length === 0) {
    return null;
  }
  const dir = (0, import_obsidian4.normalizePath)(folder).replace(/^\/+$/, "");
  if (dir !== "" && !(app.vault.getAbstractFileByPath(dir) instanceof import_obsidian4.TFolder)) {
    await app.vault.createFolder(dir);
  }
  const chapterName = (_a = chapterFile == null ? void 0 : chapterFile.basename) != null ? _a : chapterLinktext;
  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`\uD1F4\uACE0 \u2014 ${chapterName}`, existing);
  const path = (0, import_obsidian4.normalizePath)(dir === "" ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = chapterFile ? app.metadataCache.fileToLinktext(chapterFile, path, true) : chapterLinktext;
  const noteSections = savable.map((section) => ({
    prose: section.prose,
    grounding: section.grounding.map((link) => relinkText(app, link, draftFile.path, path)),
    flags: section.flags
  }));
  const content = buildRevisionNoteContent(chapterName, chapterLink, noteSections);
  return app.vault.create(path, content);
}
async function readSourceForManuscript(app, sourceFile) {
  var _a;
  const body = await app.vault.cachedRead(sourceFile);
  const sections = parseDraftNote(body);
  const frontmatter = (_a = app.metadataCache.getFileCache(sourceFile)) == null ? void 0 : _a.frontmatter;
  const fromStage = (frontmatter == null ? void 0 : frontmatter.stage) === "\uD1F4\uACE0" ? "\uD1F4\uACE0" : "\uCD08\uC548";
  const chapterRaw = typeof (frontmatter == null ? void 0 : frontmatter.chapter) === "string" ? extractWikiLink(frontmatter.chapter) : null;
  const chapterFile = chapterRaw ? app.metadataCache.getFirstLinkpathDest(chapterRaw, sourceFile.path) : null;
  const chapterLinktext = chapterRaw != null ? chapterRaw : sourceFile.basename;
  const noteFlags = Array.isArray(frontmatter == null ? void 0 : frontmatter.flags) ? frontmatter.flags.map((flag) => String(flag).trim()).filter((flag) => flag !== "") : [];
  return { chapterFile, chapterLinktext, fromStage, sections, noteFlags };
}
async function saveManuscriptNote(app, manuscript, sourceFile, chapterFile, chapterLinktext, folder) {
  var _a;
  if (manuscript.paragraphs.length === 0) {
    return null;
  }
  const dir = (0, import_obsidian4.normalizePath)(folder).replace(/^\/+$/, "");
  if (dir !== "" && !(app.vault.getAbstractFileByPath(dir) instanceof import_obsidian4.TFolder)) {
    await app.vault.createFolder(dir);
  }
  const chapterName = (_a = chapterFile == null ? void 0 : chapterFile.basename) != null ? _a : chapterLinktext;
  const existing = existingBasenames(app, dir);
  const basename = uniqueBasename(`\uC6D0\uACE0 \u2014 ${chapterName}`, existing);
  const path = (0, import_obsidian4.normalizePath)(dir === "" ? `${basename}.md` : `${dir}/${basename}.md`);
  const chapterLink = chapterFile ? app.metadataCache.fileToLinktext(chapterFile, path, true) : chapterLinktext;
  const assembledFrom = app.metadataCache.fileToLinktext(sourceFile, path, true);
  const seenSource = /* @__PURE__ */ new Set();
  const sources = [];
  for (const link of manuscript.sources) {
    const relinked = relinkText(app, link, sourceFile.path, path).trim();
    if (relinked !== "" && !seenSource.has(relinked)) {
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

// src/commands/proposeBeats.ts
async function proposeBeatsCommand(plugin) {
  var _a, _b, _c, _d, _e;
  const { app, settings } = plugin;
  const file = app.workspace.getActiveFile();
  if (!(file instanceof import_obsidian5.TFile)) {
    new import_obsidian5.Notice("\uC7A5(\uBAA9\uCC28) \uB178\uD2B8\uB97C \uBA3C\uC800 \uC5EC\uC138\uC694.");
    return;
  }
  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new import_obsidian5.Notice((_a = guard.reason) != null ? _a : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const requestedFolder = settings.beatFolder !== "" ? settings.beatFolder : (_c = (_b = file.parent) == null ? void 0 : _b.path) != null ? _c : "";
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new import_obsidian5.Notice("\uBE44\uD2B8 \uB178\uD2B8 \uD3F4\uB354 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C vault \uB0B4\uBD80 \uC0C1\uB300 \uACBD\uB85C\uB85C \uC9C0\uC815\uD558\uC138\uC694.");
    return;
  }
  const context = await collectChapterContext(app, file);
  if (context.cards.length === 0) {
    new import_obsidian5.Notice("\uC774 \uC7A5\uC5D0 \uC5F0\uACB0\uB41C \uC790\uB8CC\uC870\uC0AC \uCE74\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCE74\uB4DC \uC704\uD0A4\uB9C1\uD06C\uB97C \uBA3C\uC800 \uC5F0\uACB0\uD558\uC138\uC694.");
    return;
  }
  const language = normalizeLanguage((_e = (_d = app.metadataCache.getFileCache(file)) == null ? void 0 : _d.frontmatter) == null ? void 0 : _e.lang);
  const generate = async (feedback) => {
    const input = {
      chapterTitle: context.title,
      chapterBody: context.body,
      cards: context.cards,
      feedback,
      language
    };
    const progress = new import_obsidian5.Notice("\uBE44\uD2B8 \uC81C\uC548 \uC911\u2026", 0);
    let beats;
    try {
      beats = await requestBeats(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new import_obsidian5.Notice(error instanceof AnthropicError ? error.message : "\uBE44\uD2B8 \uC81C\uC548\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }
    progress.hide();
    if (beats.length === 0) {
      new import_obsidian5.Notice("\uC81C\uC548\uB41C \uBE44\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uCE74\uB4DC \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uAC70\uB098 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
      return;
    }
    new BeatApprovalModal(app, beats, {
      onApprove: async (selected) => {
        var _a2;
        const revalidated = revalidateBeats(selected, input);
        const savable = revalidated.filter((beat) => !beat.blocking);
        const droppedCount = selected.length - savable.length;
        if (savable.length === 0) {
          new import_obsidian5.Notice(
            droppedCount > 0 ? "\uC120\uD0DD\uD55C \uBE44\uD2B8\uAC00 \uCD9C\uCC98 \uBBF8\uC5F0\uACB0\xB7\uBBF8\uAC80\uC99D\uC774\uB77C \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." : "\uCC44\uD0DD\uB41C \uBE44\uD2B8\uAC00 \uC5C6\uC5B4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
          );
          return;
        }
        const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
        if (!saveGuard.ok) {
          new import_obsidian5.Notice((_a2 = saveGuard.reason) != null ? _a2 : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC800\uC7A5\uC744 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
          return;
        }
        try {
          const createdNotes = await saveBeatNotes(app, savable, file, context.cards, folder);
          const skipped = droppedCount > 0 ? ` (\uCD9C\uCC98 \uBBF8\uC5F0\uACB0\xB7\uBBF8\uAC80\uC99D ${droppedCount}\uAC74 \uC81C\uC678)` : "";
          new import_obsidian5.Notice(`${createdNotes.length}\uAC1C \uBE44\uD2B8 \uB178\uD2B8\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4${skipped}.`);
        } catch (error) {
          new import_obsidian5.Notice("\uBE44\uD2B8 \uB178\uD2B8 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        }
      },
      onRegenerate: async (feedbackText) => {
        await generate(feedbackText);
      }
    }).open();
  };
  await generate();
}

// src/commands/proposeDraft.ts
var import_obsidian7 = require("obsidian");

// src/ui/DraftApprovalModal.ts
var import_obsidian6 = require("obsidian");

// src/ui/draftListState.ts
var DraftListState = class {
  constructor(sections) {
    this.items = sections.map((section) => ({ section, accepted: !section.blocking }));
  }
  toggle(index) {
    const item = this.items[index];
    if (!item || item.section.blocking) {
      return;
    }
    item.accepted = !item.accepted;
  }
  move(index, direction) {
    const target = index + direction;
    if (index < 0 || index >= this.items.length || target < 0 || target >= this.items.length) {
      return;
    }
    const swapped = this.items[index];
    this.items[index] = this.items[target];
    this.items[target] = swapped;
  }
  setProse(index, prose) {
    const item = this.items[index];
    if (item) {
      item.section = { ...item.section, prose };
    }
  }
  selected() {
    return this.items.filter((item) => item.accepted).map((item) => item.section);
  }
};

// src/ui/DraftApprovalModal.ts
var DEFAULT_LABELS = {
  heading: "\uCD08\uC548 \uC81C\uC548 \u2014 \uC2B9\uC778 \uC804 \uBB34\uC800\uC7A5",
  intro: "\uAC01 \uBE44\uD2B8\uB97C \uD3BC\uCE5C \uC0B0\uBB38\uC744 \uAC80\uD1A0\xB7\uD3B8\uC9D1\uD558\uACE0 \uCC44\uD0DD\uD558\uC138\uC694. \uC2B9\uC778 \uC2DC \uCC44\uD0DD\uBD84\uB9CC \uD55C \uD3B8\uC758 \uCD08\uC548 \uB178\uD2B8\uB85C \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  approve: "\uC2B9\uC778 \u2014 \uCD08\uC548 \uC800\uC7A5",
  regenerate: "\uD53C\uB4DC\uBC31\uC73C\uB85C \uB2E4\uC2DC \uC0DD\uC131"
};
var DraftApprovalModal = class extends import_obsidian6.Modal {
  constructor(app, sections, callbacks, labels) {
    super(app);
    this.state = new DraftListState(sections);
    this.callbacks = callbacks;
    this.labels = { ...DEFAULT_LABELS, ...labels };
  }
  onOpen() {
    this.modalEl.addClass("omw-beat-modal");
    this.render();
  }
  onClose() {
    this.contentEl.empty();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.labels.heading });
    contentEl.createEl("p", { text: this.labels.intro });
    const list = contentEl.createDiv({ cls: "omw-beat-list" });
    this.state.items.forEach((item, index) => {
      const row = list.createDiv({ cls: "omw-beat-row" });
      if (!item.accepted) {
        row.addClass("omw-beat-rejected");
      }
      if (item.section.flags.length > 0) {
        row.addClass("omw-beat-flagged");
      }
      const header = row.createDiv({ cls: "omw-beat-header" });
      const accept = header.createEl("input", { type: "checkbox" });
      accept.checked = item.accepted;
      accept.disabled = item.section.blocking;
      accept.addEventListener("change", () => {
        this.state.toggle(index);
        this.render();
      });
      if (item.section.blocking) {
        header.createEl("span", { cls: "omw-beat-blocked", text: "\uC800\uC7A5 \uBD88\uAC00" });
      }
      header.createEl("span", { cls: "omw-beat-title", text: item.section.beatTitle });
      const up = header.createEl("button", { text: "\u2191" });
      up.addEventListener("click", () => {
        this.state.move(index, -1);
        this.render();
      });
      const down = header.createEl("button", { text: "\u2193" });
      down.addEventListener("click", () => {
        this.state.move(index, 1);
        this.render();
      });
      const proseInput = row.createEl("textarea", { cls: "omw-beat-line" });
      proseInput.value = item.section.prose;
      proseInput.rows = 5;
      proseInput.addEventListener("input", () => this.state.setProse(index, proseInput.value));
      const sources = item.section.sources.length > 0 ? item.section.sources.join(", ") : "(\uCD9C\uCC98 \uBBF8\uC5F0\uACB0)";
      row.createEl("div", { cls: "omw-beat-sources", text: `\uADFC\uAC70: ${sources}` });
      for (const flag of item.section.flags) {
        row.createEl("div", { cls: "omw-beat-flag", text: `\u26A0\uFE0F ${flag}` });
      }
    });
    const feedbackWrap = contentEl.createDiv({ cls: "omw-beat-feedback" });
    feedbackWrap.createEl("label", { text: "\uD53C\uB4DC\uBC31 \uC8FC\uACE0 \uB2E4\uC2DC \uC0DD\uC131 (\uC120\uD0DD):" });
    const feedbackInput = feedbackWrap.createEl("textarea", { cls: "omw-beat-feedback-input" });
    feedbackInput.rows = 2;
    const footer = contentEl.createDiv({ cls: "omw-beat-footer" });
    const approve = footer.createEl("button", { text: this.labels.approve, cls: "mod-cta" });
    approve.addEventListener("click", async () => {
      const selected = this.state.selected();
      this.close();
      await this.callbacks.onApprove(selected);
    });
    const regenerate = footer.createEl("button", { text: this.labels.regenerate });
    regenerate.addEventListener("click", async () => {
      const feedback = feedbackInput.value.trim();
      this.close();
      await this.callbacks.onRegenerate(feedback);
    });
    const cancel = footer.createEl("button", { text: "\uCDE8\uC18C" });
    cancel.addEventListener("click", () => this.close());
  }
};

// src/commands/proposeDraft.ts
async function proposeDraftCommand(plugin) {
  var _a, _b, _c, _d, _e;
  const { app, settings } = plugin;
  const file = app.workspace.getActiveFile();
  if (!(file instanceof import_obsidian7.TFile)) {
    new import_obsidian7.Notice("\uC7A5(\uBAA9\uCC28) \uB178\uD2B8\uB97C \uBA3C\uC800 \uC5EC\uC138\uC694.");
    return;
  }
  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new import_obsidian7.Notice((_a = guard.reason) != null ? _a : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const requestedFolder = settings.beatFolder !== "" ? settings.beatFolder : (_c = (_b = file.parent) == null ? void 0 : _b.path) != null ? _c : "";
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new import_obsidian7.Notice("\uBE44\uD2B8/\uCD08\uC548 \uB178\uD2B8 \uD3F4\uB354 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C vault \uB0B4\uBD80 \uC0C1\uB300 \uACBD\uB85C\uB85C \uC9C0\uC815\uD558\uC138\uC694.");
    return;
  }
  const { beats, cards } = await collectApprovedBeats(app, file);
  if (beats.length === 0) {
    new import_obsidian7.Notice("\uC774 \uC7A5\uC5D0 \uC2B9\uC778\uB41C \uBE44\uD2B8(stage:\uBE44\uD2B8\xB7status:\uC2B9\uC778)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBA3C\uC800 \uBE44\uD2B8\uB97C \uC81C\uC548\xB7\uC2B9\uC778\uD558\uC138\uC694.");
    return;
  }
  const language = normalizeLanguage((_e = (_d = app.metadataCache.getFileCache(file)) == null ? void 0 : _d.frontmatter) == null ? void 0 : _e.lang);
  const generate = async (feedback) => {
    const input = {
      chapterTitle: file.basename,
      beats,
      cards,
      feedback,
      language
    };
    const progress = new import_obsidian7.Notice("\uCD08\uC548 \uC0DD\uC131 \uC911\u2026", 0);
    let sections;
    try {
      sections = await requestDraft(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new import_obsidian7.Notice(error instanceof AnthropicError ? error.message : "\uCD08\uC548 \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }
    progress.hide();
    if (sections.length === 0) {
      new import_obsidian7.Notice("\uC0DD\uC131\uB41C \uCD08\uC548\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uBE44\uD2B8 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uAC70\uB098 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
      return;
    }
    new DraftApprovalModal(app, sections, {
      onApprove: async (selected) => {
        var _a2;
        const revalidated = revalidateDraftSections(selected, input);
        if (revalidated.length === 0) {
          new import_obsidian7.Notice("\uCC44\uD0DD\uB41C \uCD08\uC548\uC774 \uCD9C\uCC98 \uBBF8\uC5F0\uACB0\xB7\uBBF8\uAC80\uC99D\uC774\uB77C \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
          return;
        }
        const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
        if (!saveGuard.ok) {
          new import_obsidian7.Notice((_a2 = saveGuard.reason) != null ? _a2 : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC800\uC7A5\uC744 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
          return;
        }
        try {
          const created = await saveDraftNote(app, revalidated, file, beats, cards, folder);
          if (created === null) {
            new import_obsidian7.Notice("\uC800\uC7A5 \uAC00\uB2A5\uD55C \uCD08\uC548 \uB2E8\uB77D\uC774 \uC5C6\uC5B4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
            return;
          }
          const dropped = selected.length - revalidated.length;
          const skipped = dropped > 0 ? ` (\uBBF8\uAC80\uC99D ${dropped}\uAC74 \uC81C\uC678)` : "";
          new import_obsidian7.Notice(`\uCD08\uC548 \uB178\uD2B8\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4${skipped}.`);
        } catch (error) {
          new import_obsidian7.Notice("\uCD08\uC548 \uB178\uD2B8 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
        }
      },
      onRegenerate: async (feedbackText) => {
        await generate(feedbackText);
      }
    }).open();
  };
  await generate();
}

// src/commands/proposeRevision.ts
var import_obsidian8 = require("obsidian");
var REVISION_LABELS = {
  heading: "\uD1F4\uACE0 \uC81C\uC548 \u2014 \uC2B9\uC778 \uC804 \uBB34\uC800\uC7A5",
  intro: "\uB2E4\uB4EC\uC740 \uB2E8\uB77D\uC744 \uAC80\uD1A0\xB7\uD3B8\uC9D1\uD558\uACE0 \uCC44\uD0DD\uD558\uC138\uC694. \uC2B9\uC778 \uC2DC \uD55C \uD3B8\uC758 \uD1F4\uACE0 \uB178\uD2B8\uB85C \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  approve: "\uC2B9\uC778 \u2014 \uD1F4\uACE0 \uC800\uC7A5",
  regenerate: "\uD53C\uB4DC\uBC31\uC73C\uB85C \uB2E4\uC2DC \uB2E4\uB4EC\uAE30"
};
async function proposeRevisionCommand(plugin) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { app, settings } = plugin;
  const file = app.workspace.getActiveFile();
  if (!(file instanceof import_obsidian8.TFile)) {
    new import_obsidian8.Notice("\uCD08\uC548(stage:\uCD08\uC548) \uB178\uD2B8\uB97C \uBA3C\uC800 \uC5EC\uC138\uC694.");
    return;
  }
  const frontmatter = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  if ((frontmatter == null ? void 0 : frontmatter.stage) !== "\uCD08\uC548") {
    new import_obsidian8.Notice("\uC774 \uBA85\uB839\uC740 \uCD08\uC548(stage:\uCD08\uC548) \uB178\uD2B8\uC5D0\uC11C \uC2E4\uD589\uD558\uC138\uC694.");
    return;
  }
  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new import_obsidian8.Notice((_b = guard.reason) != null ? _b : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const requestedFolder = settings.beatFolder !== "" ? settings.beatFolder : (_d = (_c = file.parent) == null ? void 0 : _c.path) != null ? _d : "";
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new import_obsidian8.Notice("\uB178\uD2B8 \uD3F4\uB354 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C vault \uB0B4\uBD80 \uC0C1\uB300 \uACBD\uB85C\uB85C \uC9C0\uC815\uD558\uC138\uC694.");
    return;
  }
  const draft = await readDraftForRevision(app, file);
  if (draft.sections.length === 0) {
    new import_obsidian8.Notice("\uC774 \uCD08\uC548 \uB178\uD2B8\uC5D0\uC11C \uB2E8\uB77D\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const chapterTitle = (_f = (_e = draft.chapterFile) == null ? void 0 : _e.basename) != null ? _f : draft.chapterLinktext;
  const allowedYears = allowedYearsForRevision(draft.sections);
  const language = normalizeLanguage(
    draft.chapterFile ? (_h = (_g = app.metadataCache.getFileCache(draft.chapterFile)) == null ? void 0 : _g.frontmatter) == null ? void 0 : _h.lang : void 0
  );
  const generate = async (feedback) => {
    const input = { chapterTitle, sections: draft.sections, feedback, language };
    const progress = new import_obsidian8.Notice("\uD1F4\uACE0 \uC911\u2026", 0);
    let revised;
    try {
      revised = await requestRevision(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new import_obsidian8.Notice(error instanceof AnthropicError ? error.message : "\uD1F4\uACE0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      return;
    }
    progress.hide();
    if (revised.length === 0) {
      new import_obsidian8.Notice("\uB2E4\uB4EC\uC740 \uB2E8\uB77D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694.");
      return;
    }
    const draftSections = revised.map((section, index) => ({
      beatTitle: `\uB2E8\uB77D ${index + 1}`,
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
          var _a2;
          if (selected.length === 0) {
            new import_obsidian8.Notice("\uCC44\uD0DD\uB41C \uB2E8\uB77D\uC774 \uC5C6\uC5B4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
            return;
          }
          const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
          if (!saveGuard.ok) {
            new import_obsidian8.Notice((_a2 = saveGuard.reason) != null ? _a2 : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC800\uC7A5\uC744 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
            return;
          }
          const edited = selected.map((section) => ({
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
              new import_obsidian8.Notice("\uC800\uC7A5 \uAC00\uB2A5\uD55C \uB2E8\uB77D\uC774 \uC5C6\uC5B4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
              return;
            }
            new import_obsidian8.Notice("\uD1F4\uACE0 \uB178\uD2B8\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4.");
          } catch (error) {
            new import_obsidian8.Notice("\uD1F4\uACE0 \uB178\uD2B8 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
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

// src/commands/proposeManuscript.ts
var import_obsidian10 = require("obsidian");

// src/ai/manuscript.ts
function dedupePush(target, seen, value) {
  const key = value.trim();
  if (key !== "" && !seen.has(key)) {
    seen.add(key);
    target.push(key);
  }
}
function assembleManuscript(input) {
  var _a;
  const paragraphs = [];
  const sources = [];
  const flags = [];
  const seenSource = /* @__PURE__ */ new Set();
  const seenFlag = /* @__PURE__ */ new Set();
  for (const section of input.sections) {
    const prose = section.prose.trim();
    if (prose === "") {
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
  for (const flag of (_a = input.noteFlags) != null ? _a : []) {
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

// src/ui/ManuscriptPreviewModal.ts
var import_obsidian9 = require("obsidian");
var ManuscriptPreviewModal = class extends import_obsidian9.Modal {
  constructor(app, manuscript, callbacks) {
    super(app);
    this.manuscript = manuscript;
    this.callbacks = callbacks;
  }
  onOpen() {
    this.modalEl.addClass("omw-beat-modal");
    const { contentEl, manuscript } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\uC6D0\uACE0 \uC870\uB9BD \u2014 \uC2B9\uC778 \uC804 \uBB34\uC800\uC7A5" });
    contentEl.createEl("p", {
      text: `${manuscript.fromStage} ${manuscript.paragraphs.length}\uAC1C \uB2E8\uB77D\uC744 \uCD5C\uC885 \uC6D0\uACE0\uB85C \uC870\uB9BD\uD569\uB2C8\uB2E4. \uC0C8 \uBB38\uC7A5\xB7\uC0AC\uC2E4\uC740 \uCD94\uAC00\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
    });
    if (manuscript.flags.length > 0) {
      const warn = contentEl.createDiv({ cls: "omw-beat-row omw-beat-flagged" });
      warn.createEl("div", {
        cls: "omw-beat-flag",
        text: `\u26A0\uFE0F \uBBF8\uD574\uACB0 \uD655\uC778 \uD56D\uBAA9 ${manuscript.flags.length}\uAC74\uC774 \uC6D0\uACE0 \uB05D\uC5D0 \uADF8\uB300\uB85C \uD45C\uC2DC\uB429\uB2C8\uB2E4:`
      });
      for (const flag of manuscript.flags) {
        warn.createEl("div", { cls: "omw-beat-flag", text: `\u26A0\uFE0F ${flag}` });
      }
    }
    const list = contentEl.createDiv({ cls: "omw-beat-list" });
    manuscript.paragraphs.forEach((para) => {
      const row = list.createDiv({ cls: "omw-beat-row" });
      row.createEl("div", { cls: "omw-manuscript-para", text: para });
    });
    contentEl.createDiv({
      cls: "omw-beat-sources",
      text: `\uCD9C\uCC98 ${manuscript.sources.length}\uAC74\uC774 frontmatter(sources)\uC640 \uC6D0\uBCF8 \uB9C1\uD06C(assembled_from)\uB85C \uBCF4\uC874\uB429\uB2C8\uB2E4.`
    });
    const footer = contentEl.createDiv({ cls: "omw-beat-footer" });
    const approve = footer.createEl("button", { text: "\uC2B9\uC778 \u2014 \uC6D0\uACE0 \uC800\uC7A5", cls: "mod-cta" });
    approve.addEventListener("click", async () => {
      this.close();
      await this.callbacks.onApprove();
    });
    const cancel = footer.createEl("button", { text: "\uCDE8\uC18C" });
    cancel.addEventListener("click", () => this.close());
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/commands/proposeManuscript.ts
async function proposeManuscriptCommand(plugin) {
  var _a, _b, _c, _d, _e, _f;
  const { app, settings } = plugin;
  const file = app.workspace.getActiveFile();
  if (!(file instanceof import_obsidian10.TFile)) {
    new import_obsidian10.Notice("\uD1F4\uACE0(stage:\uD1F4\uACE0) \uB610\uB294 \uCD08\uC548(stage:\uCD08\uC548) \uB178\uD2B8\uB97C \uBA3C\uC800 \uC5EC\uC138\uC694.");
    return;
  }
  const frontmatter = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  const stage = frontmatter == null ? void 0 : frontmatter.stage;
  if (stage !== "\uD1F4\uACE0" && stage !== "\uCD08\uC548") {
    new import_obsidian10.Notice("\uC774 \uBA85\uB839\uC740 \uD1F4\uACE0(stage:\uD1F4\uACE0) \uB610\uB294 \uCD08\uC548(stage:\uCD08\uC548) \uB178\uD2B8\uC5D0\uC11C \uC2E4\uD589\uD558\uC138\uC694.");
    return;
  }
  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new import_obsidian10.Notice((_b = guard.reason) != null ? _b : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const requestedFolder = settings.beatFolder !== "" ? settings.beatFolder : (_d = (_c = file.parent) == null ? void 0 : _c.path) != null ? _d : "";
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new import_obsidian10.Notice("\uB178\uD2B8 \uD3F4\uB354 \uACBD\uB85C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC5D0\uC11C vault \uB0B4\uBD80 \uC0C1\uB300 \uACBD\uB85C\uB85C \uC9C0\uC815\uD558\uC138\uC694.");
    return;
  }
  const source = await readSourceForManuscript(app, file);
  if (source.sections.length === 0) {
    new import_obsidian10.Notice("\uC774 \uB178\uD2B8\uC5D0\uC11C \uB2E8\uB77D\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    return;
  }
  const chapterTitle = (_f = (_e = source.chapterFile) == null ? void 0 : _e.basename) != null ? _f : source.chapterLinktext;
  const input = {
    chapterTitle,
    fromStage: source.fromStage,
    sections: source.sections,
    noteFlags: source.noteFlags
  };
  const manuscript = assembleManuscript(input);
  if (manuscript.paragraphs.length === 0) {
    new import_obsidian10.Notice("\uC870\uB9BD\uD560 \uB2E8\uB77D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    return;
  }
  new ManuscriptPreviewModal(app, manuscript, {
    onApprove: async () => {
      var _a2;
      const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
      if (!saveGuard.ok) {
        new import_obsidian10.Notice((_a2 = saveGuard.reason) != null ? _a2 : "vault \uACBD\uB85C \uAC00\uB4DC\uC5D0 \uB9C9\uD600 \uC800\uC7A5\uC744 \uC911\uB2E8\uD588\uC2B5\uB2C8\uB2E4.");
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
          new import_obsidian10.Notice("\uC870\uB9BD\uD560 \uB2E8\uB77D\uC774 \uC5C6\uC5B4 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
          return;
        }
        const flagNote = manuscript.flags.length > 0 ? ` (\uD655\uC778 \uD544\uC694 ${manuscript.flags.length}\uAC74 \uD45C\uC2DC)` : "";
        new import_obsidian10.Notice(`\uC6D0\uACE0 \uB178\uD2B8\uB97C \uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4${flagNote}.`);
      } catch (error) {
        new import_obsidian10.Notice("\uC6D0\uACE0 \uB178\uD2B8 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
      }
    }
  }).open();
}

// src/main.ts
var OmwPipelinePlugin = class extends import_obsidian11.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "propose-beats",
      name: "\uBE44\uD2B8 \uC81C\uC548 \u2014 \uC774 \uC7A5\uC758 \uC790\uB8CC\uC870\uC0AC\uB85C",
      callback: () => {
        void proposeBeatsCommand(this);
      }
    });
    this.addCommand({
      id: "propose-draft",
      name: "\uCD08\uC548 \uC0DD\uC131 \u2014 \uC774 \uC7A5\uC758 \uBE44\uD2B8\uB85C",
      callback: () => {
        void proposeDraftCommand(this);
      }
    });
    this.addCommand({
      id: "propose-revision",
      name: "\uD1F4\uACE0 \u2014 \uC774 \uCD08\uC548 \uB2E4\uB4EC\uAE30",
      callback: () => {
        void proposeRevisionCommand(this);
      }
    });
    this.addCommand({
      id: "propose-manuscript",
      name: "\uC6D0\uACE0 \uC870\uB9BD \u2014 \uC774 \uD1F4\uACE0/\uCD08\uC548\uC744 \uCD5C\uC885 \uC6D0\uACE0\uB85C",
      callback: () => {
        void proposeManuscriptCommand(this);
      }
    });
    this.addSettingTab(new OmwSettingTab(this.app, this));
  }
  onunload() {
  }
  async loadSettings() {
    var _a;
    const raw = (_a = await this.loadData()) != null ? _a : {};
    const hadApiKey = Object.prototype.hasOwnProperty.call(raw, "apiKey");
    const legacyKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
    if (legacyKey !== "" && !hasSavedKey()) {
      try {
        saveLocalKey(legacyKey);
      } catch (error) {
        new import_obsidian11.Notice("\uAE30\uC874 Claude \uD0A4\uB97C \uC774 PC\uB85C \uC62E\uAE30\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uD50C\uB7EC\uADF8\uC778 \uC124\uC815\uC5D0\uC11C \uD0A4\uB97C \uB2E4\uC2DC \uC785\uB825\uD558\uC138\uC694.");
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
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
