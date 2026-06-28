# Oh My Wiki Pipeline

**위키를 책의 "작업 상태"로 삼아, 글을 단계별로 전진시키는 Obsidian 글쓰기 파이프라인.**
AI는 *제안*만 하고, 사람이 승인하며, 모든 문장은 출처로 추적된다 — 절대 지어내지 않는다.

> 베타(0.1.0). 논픽션·구술 기반 책 집필에서 첫 검증을 거쳤다.

## 무엇을 하나

대부분의 AI 글쓰기 도구는 메모에서 초안으로 *건너뛴다*. 그 사이의 사고 과정 — 무엇을 쓸지, 무엇에 근거하는지 — 은 사라지고, 모델은 그럴듯한 거짓을 채워 넣는다.

이 플러그인은 책의 작업을 하나의 스파인으로 본다:

```
목차 → 자료조사 → 비트 → 초안 → 퇴고 → 원고
```

각 단계에서 AI가 *다음 산출물을 제안*하고, 당신이 승인 모달에서 검토·편집·채택한다. **승인 전에는 vault에 아무것도 쓰지 않는다.** 저장된 모든 산출물은 frontmatter 위키링크로 출처에 연결된다 — 문장 → 비트 → 자료조사 카드 → 인터뷰까지.

## 안 지어냄 (핵심 규율)

- **화이트리스트 그라운딩** — 그 장에 연결된 자료조사 카드만 컨텍스트로 들어간다.
- **출처 없으면 저장 안 됨** — 근거가 연결되지 않은 비트·단락은 저장에서 차단된다.
- **연도·고유명사 플래그** — 원문(카드)에 없는 4자리 연도가 등장하면 ⚠️로 표시한다.
- **권위 있는 플래그 승계** — 미해결 ⚠️는 다음 단계로, 그리고 최종 원고의 「확인 필요」 섹션으로 그대로 따라간다. 조용히 사라지지 않는다.

## 명령 (4)

| 명령 | 입력 | 산출 |
|---|---|---|
| **비트 제안 — 이 장의 자료조사로** | 활성 장 노트 + 연결된 자료조사 카드 | `stage:비트` 노트들 |
| **초안 생성 — 이 장의 비트로** | 활성 장의 승인된 비트 | `stage:초안` 노트 |
| **퇴고 — 이 초안 다듬기** | 활성 초안 노트 | `stage:퇴고` 노트 |
| **원고 조립 — 이 퇴고/초안을 최종 원고로** | 활성 퇴고(없으면 초안) 노트 | `stage:원고` 노트 (깨끗한 본문 + 출처 보존) |

원고 단계는 AI를 쓰지 않는다 — 승인된 단락을 *결정론적으로 조립*만 한다. 마지막 단계에서 새 문장을 생성하면 안 지어냄 규율에 새 환각면이 생기기 때문이다.

## 요구사항

- Obsidian 1.5+ (데스크톱 전용 — Anthropic API 직접 호출)
- 본인의 Anthropic API 키 ([console.anthropic.com](https://console.anthropic.com))

## 설치 (베타 — BRAT)

1. Obsidian 커뮤니티 플러그인에서 **BRAT**(Beta Reviewer's Auto-update Tool)를 설치·활성화.
2. BRAT → *Add beta plugin* → `simonsez9510/oh-my-wiki-pipeline` 입력.
3. 커뮤니티 플러그인 목록에서 **Oh My Wiki Pipeline**을 활성화.

## 설정

- **Claude API 키** — 이 PC의 홈 폴더에만 저장된다. vault·동기화 드라이브·다른 PC와 **공유되지 않는다.** 공유 vault에서도 각자 자기 키를 쓴다.
- **모델** — 기본 `claude-opus-4-8`.
- **노트 폴더** — 비우면 현재 장 노트와 같은 폴더에 저장.
- **정본 vault 경로(선택)** — 설정하면 활성 vault가 다를 때 저장을 중단한다(동기화 사본에 잘못 쓰는 사고 방지).

## 출력 언어

장 노트 frontmatter에 `lang: ru`를 넣으면 그 장의 비트·초안·퇴고가 러시아어로 생성된다(다국어 공저 대응). 비우면 한국어.

## 범용성

특정 책에 묶이지 않는다. 노트를 `stage` frontmatter로 식별하므로 **폴더 구조에 의존하지 않고**, Obsidian에서 다른 책 vault를 열면 그 책에 그대로 작동한다.

## 라이선스

MIT — `LICENSE` 참조.

---

## English summary

**An Obsidian writing pipeline that treats your vault as a book's "work state" and advances it stage by stage** (outline → research → beats → draft → revision → manuscript). The AI only *proposes*; you approve; every sentence is traced back to its source — it never fabricates.

Grounding is enforced three ways: whitelist context (only the chapter's linked research cards), no-source-no-save, and year/proper-noun flags for anything not present in the source cards. Unresolved flags are carried forward to the final manuscript's "확인 필요" (needs-check) section rather than silently dropped.

Desktop only; requires your own Anthropic API key (stored locally, never synced). Install via BRAT: `simonsez9510/oh-my-wiki-pipeline`. MIT licensed.
