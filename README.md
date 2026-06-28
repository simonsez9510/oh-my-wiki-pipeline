# Oh My Wiki Pipeline

**위키를 책의 "작업 상태"로 삼아, 글을 단계마다 한 칸씩 밀고 나가는 Obsidian 글쓰기 파이프라인.**
초안은 AI가, 채택은 사람이 한다. 문장마다 출처가 따라붙고 없는 사실은 만들어내지 않는다.

> 베타(0.1.0). 논픽션과 구술을 엮는 책 작업에서 처음 검증했다.

## 무엇을 하나

AI 글쓰기 도구는 대개 메모에서 초안으로 곧장 건너뛴다. 무엇을 쓸지, 무엇에 기대어 쓸지 따져 보는 과정은 그 사이에서 사라진다. 그 빈자리를 모델이 그럴듯한 거짓으로 메운다.

이 플러그인은 책 쓰는 일을 하나의 줄기로 본다.

```
목차 → 자료조사 → 비트 → 초안 → 퇴고 → 원고
```

단계마다 AI가 다음 산출물을 먼저 내놓는다. 사람은 승인 모달에서 그것을 검토하고 고치고 채택한다. **승인하기 전까지 vault에는 아무것도 쓰지 않는다.** 저장된 글은 frontmatter 위키링크를 타고 출처로 거슬러 올라간다. 문장에서 비트로, 비트에서 자료조사 카드로, 거기서 다시 인터뷰까지.

## 안 지어냄 (핵심 규율)

- **화이트리스트 그라운딩** — 그 장에 연결된 자료조사 카드만 AI 앞에 놓는다.
- **출처 없으면 저장 안 됨** — 근거가 안 붙은 비트·단락은 저장 단계에서 막는다.
- **연도·고유명사 플래그** — 원문 카드에 없던 4자리 연도가 튀어나오면 ⚠️로 표시한다.
- **플래그 승계** — 미처 확인 못 한 ⚠️는 다음 단계로, 또 최종 원고의 「확인 필요」 칸까지 따라붙는다. 슬그머니 지워지지 않는다.

## 명령 (4)

| 명령 | 입력 | 산출 |
|---|---|---|
| **비트 제안 — 이 장의 자료조사로** | 활성 장 노트 + 연결된 자료조사 카드 | `stage:비트` 노트들 |
| **초안 생성 — 이 장의 비트로** | 활성 장의 승인된 비트 | `stage:초안` 노트 |
| **퇴고 — 이 초안 다듬기** | 활성 초안 노트 | `stage:퇴고` 노트 |
| **원고 조립 — 이 퇴고/초안을 최종 원고로** | 활성 퇴고(없으면 초안) 노트 | `stage:원고` 노트 (깨끗한 본문 + 출처 보존) |

원고 단계만은 AI를 부르지 않는다. 승인된 단락을 정해진 규칙대로 모아 붙일 뿐이다. 마지막에 다시 문장을 지어내기 시작하면 여기까지 지켜 온 '안 지어냄'이 거기서 무너진다.

## 요구사항

- Obsidian 1.5+ (데스크톱 전용 — Anthropic API를 직접 부른다)
- 본인 Anthropic API 키 ([console.anthropic.com](https://console.anthropic.com))

## 설치 (베타 — BRAT)

1. Obsidian 커뮤니티 플러그인에서 **BRAT**(Beta Reviewer's Auto-update Tool)를 설치하고 켠다.
2. BRAT에서 *Add beta plugin*을 고르고 `simonsez9510/oh-my-wiki-pipeline`을 입력한다.
3. 커뮤니티 플러그인 목록에서 **Oh My Wiki Pipeline**을 켠다.

## 설정

- **Claude API 키** — 이 PC의 홈 폴더에만 둔다. vault나 동기화 드라이브, 다른 PC로는 **넘어가지 않는다.** vault를 함께 쓰더라도 키는 각자 자기 것을 쓴다.
- **모델** — 기본값은 `claude-opus-4-8`.
- **노트 폴더** — 비워 두면 지금 장 노트와 같은 폴더에 저장한다.
- **정본 vault 경로(선택)** — 적어 두면 다른 vault에서 작업할 때 저장을 멈춘다. 동기화 사본에 잘못 쓰는 사고를 막아 준다.

## 출력 언어

한국어가 기본이다. 장 노트 frontmatter에 `lang: ru`를 적으면 그 장만 비트·초안·퇴고를 러시아어로 쓴다. 한국어와 러시아어를 함께 쓰는 공저, 이를테면 고려인 디아스포라 기록 같은 작업을 위해 둔 기능이다. 비워 두면 한국어로 나온다.

## 범용성

특정 책에 매이지 않는다. 노트를 `stage` frontmatter로 알아보기 때문에 폴더가 어떻게 생겼든 상관하지 않는다. Obsidian에서 다른 책 vault를 열면 거기서도 똑같이 돌아간다.

## 라이선스

MIT — `LICENSE` 참조.

---

## English summary

**An Obsidian writing pipeline that treats your vault as a book's "work state" and advances it stage by stage** (outline → research → beats → draft → revision → manuscript). The AI only *proposes*; you approve; every sentence is traced back to its source — it never fabricates. The interface and prompts are Korean, and output is Korean by default; a chapter can be set to Russian (`lang: ru`) for bilingual co-authoring.

Grounding is enforced three ways: whitelist context (only the chapter's linked research cards), no-source-no-save, and year/proper-noun flags for anything not present in the source cards. Unresolved flags are carried forward to the final manuscript's "확인 필요" (needs-check) section rather than silently dropped.

Desktop only; requires your own Anthropic API key (stored locally, never synced). Install via BRAT: `simonsez9510/oh-my-wiki-pipeline`. MIT licensed.
