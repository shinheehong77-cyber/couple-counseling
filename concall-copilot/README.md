# 콘콜 코파일럿

국내외 콘콜(실적 콜·IR 미팅·전문가 콜)을 **녹음**하고, 통화하는 동안 옆 화면에
**지금 고려하고 판단해야 할 것**을 실시간 카드로 띄워주는 개인용 시스템입니다.

- 실시간 자막: 내 마이크 = "나", 회의 소리 = "상대"로 자동 구분 (한·영 혼용 가능)
- 판단 보조 카드: **판단 포인트 · 지금 물어볼 질문 · 기술 해석 · 숫자 · 내 자료 · 웹 확인**
- 통화 중 묻기: "방금 말한 수율이 경쟁사보다 높은 거 맞아?" → 대화 + 내 자료 + 웹을 근거로 답변
- 📌 표시(Option/Alt+B)·혼자 쓰는 메모 → 분석과 콜 메모에 반영, 카드 👍/👎 → 다음 카드부터 취향에 맞춤
- 사전 브리핑, 콜 종료 시 콜 메모 자동 작성 → 자동으로 "내 자료"에 저장되어 다음 콜에서 비교에 쓰임
- **로컬 전사(기본 권장)**: 이 컴퓨터에서 Whisper 모델이 직접 전사 — 녹음이 외부로 나가지 않고 무료
- 녹음·자막·메모는 모두 이 컴퓨터의 `data/` 폴더에만 저장 (외부로 나가는 건 Claude 분석용 **텍스트**뿐)

기획 배경(기존 서비스 조사)과 설계는 [docs/PLAN.md](docs/PLAN.md)에 있습니다.

## 한 번에 켜기 (Mac)

```bash
brew install node whisper-cpp     # 처음 한 번 (whisper-cpp = 로컬 전사 엔진)
cd concall-copilot
npm run up                        # 패키지 설치 → 전사 엔진 → 앱 → Chrome 까지 자동
```

처음 실행 때 전사 모델(약 550MB)을 내려받느라 몇 분 걸려요. 끄려면 터미널에서 Ctrl+C.

## 빠르게 써보기 (키 없이 데모)

```bash
cd concall-copilot
npm install
npm start          # → http://localhost:4100
```

1. "새 콜" 화면 오른쪽 아래 **데모용 내 자료 넣기**
2. **데모 정보 채우기** → **콜 시작** — 가상의 기업 실적 콜이 재생되며 카드가 쌓입니다
3. 아래 입력창에 질문, 끝나면 **종료 & 메모**

키가 없으면 규칙 기반(숫자 포착, 기술 용어 사전, 내 자료 매칭)으로만 동작합니다. 실제 판단 카드·웹 확인은 아래 키가 필요합니다.

## 실제 통화에 쓰기

### 1. 로컬 전사 엔진 켜기 (권장)

Mac(Apple Silicon) 기준:

```bash
brew install whisper-cpp      # 처음 한 번
npm run stt                   # 처음 실행 때 모델(약 550MB) 자동 다운로드 → 127.0.0.1:8178 에서 대기
```

다른 터미널에서 `npm start` 하면 "새 콜" 화면에 **로컬 전사 (권장)**이 켜집니다.

- 모델: whisper large-v3-turbo (q5_0 양자화). 한국어·영어 모두 지원, M1 이상이면 발화 하나를 1초 안팎에 전사
- 더 정확하게: `WHISPER_MODEL=large-v3-turbo npm run stt` / 가벼운 노트북: `WHISPER_MODEL=small npm run stt`
- 브라우저가 말소리 구간을 잘라(0.7초 쉬면 끊음) 보내므로, 확정 자막은 **문장 단위로 1~3초 늦게** 뜹니다. 긴 발화는 말하는 도중에도 2.5초마다 미리보기 자막을 보여줘요. 단어 단위 실시간 자막이 필요하면 Soniox 모드를 쓰세요
- 내 마이크와 상대 소리를 따로 전사해서 "나"/"상대"를 구분합니다 (Whisper 자체엔 화자 분리가 없음)
- 무음에서 Whisper가 지어내는 문구("시청해주셔서 감사합니다" 등)는 자동으로 걸러요
- whisper.cpp 대신 OpenAI 호환 로컬 서버(speaches, MLX 기반 서버 등)를 쓰려면 `.env`에 `LOCAL_STT_API=openai`, `LOCAL_STT_URL=...`

### 2. 키 설정

`.env.example`을 `.env`로 복사하고 채웁니다.

| 변수 | 용도 | 없으면 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 실시간 카드, 웹 확인, 묻기, 브리핑, 콜 메모 (Claude) | 오프라인 규칙 기반 |
| `LOCAL_STT_URL` | 로컬 전사 엔진 주소 (기본 `http://127.0.0.1:8178`) | |
| `SONIOX_API_KEY` | (선택) 클라우드 음성인식 — 단어 단위로 가장 빠름, 한·영 혼용·화자 분리 강함. 오디오가 Soniox로 전송됨 | 로컬 전사 / 브라우저 내장 인식 |
| `KB_DIRS` | 내 메모 폴더(Obsidian 등) 자동 색인. 쉼표로 여러 개 | 화면에서 직접 올리기 |
| `LIVE_MODEL` / `DEEP_MODEL` | 기본 `claude-opus-5-5`. 카드가 늦게 느껴지면 `LIVE_MODEL`을 `claude-sonnet-5-5`나 `claude-haiku-5-5`로 바꿔 비교해 보세요 | |

### 상대 목소리 가져오기
- **Zoom/Teams/Meet 웹 버전 (가장 쉬움)**: 콜 시작 시 뜨는 공유 창에서 회의 탭을 고르고 "탭 오디오 공유" 체크
- **데스크톱 앱**: 공유 창에서 "전체 화면" + "시스템 오디오도 공유" 체크. Mac은 macOS 14.2 이상 + Chrome 141 이상에서 됩니다
- 그래도 안 잡히면 Mac은 [BlackHole](https://github.com/ExistentialAudio/BlackHole) 같은 가상 오디오 장치로 회의 소리를 넘기거나 웹 버전 사용
- **전화·대면 미팅**: 스피커폰으로 두고 "내 마이크"만 켜면 화자 분리로 구분합니다 (화자, 화자 2…)

> 녹음 전에 상대방 동의를 받으세요. 서버는 기본적으로 이 컴퓨터(127.0.0.1)에서만 접속됩니다.

## 내 자료
리서치 노트, 지난 콜 메모, 모델 가정, 기사 스크랩을 넣어두면 통화 중 관련 대목을 찾아 지금 발언과 비교합니다.
- 화면에서 붙여넣기 / 파일 끌어놓기 (.md .txt .csv .json .pdf)
- `KB_DIRS` 폴더 자동 색인 (수정된 파일만 다시 색인)
- 끝난 콜의 메모·전문은 자동 추가

검색은 임베딩 없이 BM25 + 한글 2-gram으로 동작해 별도 비용이 없습니다.

## 구조

```
concall-copilot/
  server/         Node(TypeScript, tsx) — 의존성: @anthropic-ai/sdk, zod, unpdf
    index.ts      HTTP + SSE 라우트
    engine.ts     실시간 분석 스케줄러, 웹 확인, 묻기, 브리핑, 종료 메모
    llm.ts        Claude 호출 (구조화 출력 · 웹 검색 · 거절 시 대체 모델)
    prompts.ts    시스템 프롬프트 (카드 정의)
    prefs.ts      카드 👍/👎 기억 → 실시간 분석에 반영
    kb.ts         내 자료 색인/검색 (BM25)
    mock.ts       오프라인 규칙 기반 카드
    local-stt.ts  로컬 전사 엔진 연결 (whisper.cpp / OpenAI 호환), 환각 문구 필터
    stt.ts        Soniox 임시 키 발급
    store.ts      data/ 파일 저장
  public/         브라우저 화면 (빌드 없음)
    audio.js      마이크/회의 소리 캡처, 녹음 업로드
    local-stt.js  말소리 구간 감지(VAD) → 16kHz WAV → 로컬 전사
    stt.js        Soniox · 브라우저 내장 · 데모 음성인식
    app.js        화면 (새 콜, 콜, 지난 콜, 내 자료)
  scripts/        up.sh — 한 번에 켜기 / local-stt.sh — 전사 엔진 설치 확인·모델 다운로드·실행
  samples/        데모 콜 대본, 데모용 가상 자료
  test/           단위 테스트, 브라우저 E2E
```

## 개발

```bash
npm run dev        # 파일 변경 시 자동 재시작
npm test           # 단위 테스트 (토크나이저, BM25, 오프라인 카드)
npm run e2e        # Playwright: 데모 콜 전체 흐름 + 로컬 전사 경로(가짜 마이크 → VAD → WAV → whisper 형식 서버)
npm run typecheck
```
