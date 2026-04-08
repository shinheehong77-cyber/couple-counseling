/**
 * 과제 풀 — 갈등 수준 + 카테고리별 분류
 * 상담사 프롬프트에 주입되어 대화 맥락에 맞는 과제를 선택하게 함
 *
 * 임상 기반:
 * - Gottman Method (Love Maps, Fondness & Admiration, Turning Toward, 4 Horsemen 해독제, Repair Checklist, Dreams Within Conflict)
 * - EFT 감정중심치료 (감정 접근성, 애착 욕구 표현, 부정적 순환 인식)
 * - CBCT 인지행동 부부치료 (인지 재구성, 행동 교환)
 * - 한국 문화 적응 (체면 인식, 시댁/처가 경계 설정, 정 탐색)
 */

export type ConflictLevel = "mild" | "moderate" | "severe";

export interface AssignmentTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  conflictLevel: ConflictLevel[];
  category: string;
  isDaily: boolean;
  difficulty: number; // 1-3 (쉬움-어려움)
}

export const ASSIGNMENT_POOL: AssignmentTemplate[] = [
  // ═══════════════════════════════════════════
  // 1. COMMUNICATION (소통) — 13개
  // ═══════════════════════════════════════════

  {
    id: "comm-01",
    title: "15분 하루 나눔 대화",
    description:
      "매일 저녁 식사 후 15분간, 핸드폰을 치우고 서로의 하루를 공유하세요. 이때 조언이나 판단 없이, '그랬구나'라고 반응하며 들어주세요. 타이머를 맞추고, 7분씩 번갈아 이야기하세요.",
    type: "communication_exercise",
    conflictLevel: ["mild", "moderate"],
    category: "communication",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "comm-02",
    title: "나-전달법 연습 (NVC)",
    description:
      "하루 1회 이상 비폭력 대화 형식을 사용하세요: '나는 [구체적 상황]일 때 [감정]이 들어요. 왜냐하면 [충족되지 않은 욕구]가 있기 때문이에요. [구체적 요청]해주면 좋겠어요.' 예: '나는 네가 늦게 올 때 불안해져요. 안전하다는 걸 알고 싶어서요. 늦을 때 문자 한 통 보내줄 수 있어요?'",
    type: "communication_exercise",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "comm-03",
    title: "부드러운 대화 시작 (Gottman Soft Startup)",
    description:
      "불만이 있을 때 '너는 왜 항상...' 대신 부드러운 시작으로 바꿔보세요. 공식: '나는 [상황]에 대해 [감정]이 들어요. [구체적 요청]해주면 좋겠어요.' 비판을 요청으로 전환하는 연습입니다. 오늘 하루 한 가지 불만을 이 형식으로 표현해보세요.",
    type: "communication_exercise",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "comm-04",
    title: "반영적 경청 연습 (Speaker-Listener)",
    description:
      "하루 10분, 화자-청자 기법을 연습하세요. 화자가 3-4문장을 말하면, 청자는 '당신이 말한 건 ~라는 거죠?'라고 요약합니다. 화자가 '맞아요' 할 때까지 반복하고, 그 다음 역할을 바꾸세요. 바닥에 작은 물건(펜, 리모컨)을 놓고, 그것을 든 사람만 말할 수 있는 규칙을 정하면 도움이 됩니다.",
    type: "active_listening",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "communication",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "comm-05",
    title: "요청 vs 비난 변환 일지",
    description:
      "오늘 파트너에게 하고 싶었던 말 중 비난이 될 수 있는 것을 3개 적으세요. 각각을 구체적 요청으로 변환하세요. 예: '왜 항상 설거지 안 해?' → '저녁 먹고 설거지 번갈아 하면 좋겠어요. 오늘은 네 차례 맞지?' 변환한 것 중 1개를 실제로 사용해보세요.",
    type: "communication_exercise",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "comm-06",
    title: "사랑의 지도 질문 게임 (Gottman Love Maps)",
    description:
      "서로에 대해 얼마나 알고 있는지 확인하는 질문을 주고받으세요. 예: '요즘 가장 스트레스받는 일은?', '가장 친한 친구 이름은?', '어릴 때 꿈은 뭐였어?', '요즘 읽고 있는 책은?', '가장 좋아하는 음식이 바뀌었어?' 각자 5개 질문을 준비해서 저녁에 교환하세요.",
    type: "relationship_building",
    conflictLevel: ["mild"],
    category: "communication",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "comm-07",
    title: "감정 어휘 확장 연습",
    description:
      "대화할 때 '짜증나', '화나' 같은 표면 감정 대신 그 아래 감정을 찾아보세요. '짜증나' → '사실은 무시당한 느낌이 들어서 서운해요', '화나' → '사실은 걱정이 돼서 불안해요'. 오늘 하루 동안 표면 감정이 올라올 때마다 '사실은...'으로 시작하는 문장을 만들어보세요.",
    type: "communication_exercise",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "comm-08",
    title: "디지털 소통 규칙 만들기",
    description:
      "카톡/문자로 갈등을 다루지 않기로 약속하세요. 함께 다음 규칙을 정하세요: (1) 감정적인 이야기는 직접 만나서만, (2) 카톡은 일정/정보 전달용으로만, (3) 읽씹(읽고 답 안 함)이 불가피할 때는 '나중에 답할게'라고 먼저 보내기. 이 규칙을 메모장에 적어 두 사람 다 볼 수 있게 공유하세요.",
    type: "communication_exercise",
    conflictLevel: ["moderate"],
    category: "communication",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "comm-09",
    title: "꿈 속의 갈등 대화 (Gottman Dreams Within Conflict)",
    description:
      "해결되지 않는 반복 갈등 하나를 골라, 각자 그 문제에 대한 '꿈'이 무엇인지 이야기하세요. 이 갈등 뒤에 어떤 소망, 가치관, 어린 시절 경험이 있는지 탐색합니다. 20분간 한 사람이 이야기하고, 다른 사람은 '그 꿈이 네게 왜 중요해?'라고만 질문하세요. 해결하려 하지 말고 이해하려고만 하세요.",
    type: "deep_conversation",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "comm-10",
    title: "감사 시작 대화법",
    description:
      "어려운 이야기를 꺼낼 때, 먼저 감사나 인정으로 시작하세요. 예: '요즘 아이들 돌봄 많이 해줘서 고마워. 그런데 한 가지 이야기하고 싶은 게 있어.' 비판적 시작 대신 긍정적 시작이 대화의 결과를 크게 바꿉니다. 오늘 하나의 어려운 대화에 이 방법을 적용해보세요.",
    type: "communication_exercise",
    conflictLevel: ["moderate"],
    category: "communication",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "comm-11",
    title: "주간 관계 회의",
    description:
      "매주 정해진 시간(예: 일요일 저녁 9시)에 30분간 관계 회의를 하세요. 순서: (1) 이번 주 감사한 점 3가지씩 공유, (2) 개선이 필요한 점 1가지씩 부드럽게 전달, (3) 다음 주 함께할 것 1가지 정하기. 갈등이 격해지면 즉시 중단하고 다음 회의로 미루세요.",
    type: "communication_exercise",
    conflictLevel: ["mild", "moderate"],
    category: "communication",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "comm-12",
    title: "판단 없이 듣기 20분",
    description:
      "파트너가 20분간 자유롭게 이야기하는 동안, 해결책을 제시하지 말고 오직 공감만 표현하세요. 사용할 수 있는 반응: '그랬구나', '힘들었겠다', '그런 마음이 들 수 있지', '더 이야기해줄래?'. 절대 '그건 네가...' '그럴 때는...'으로 시작하지 마세요.",
    type: "active_listening",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "comm-13",
    title: "체면 내려놓기 대화 (한국 문화 적응)",
    description:
      "한국 문화에서는 체면 때문에 솔직한 감정 표현이 어려울 수 있어요. 오늘 파트너에게 '사실 내가 체면 때문에 말 못했던 게 있어'라고 시작하는 대화를 해보세요. 작은 것이라도 괜찮아요. 예: '사실 직장에서 힘든 일이 있었는데, 약한 모습 보이기 싫어서 말 못했어.'",
    type: "cultural_adaptation",
    conflictLevel: ["moderate", "severe"],
    category: "communication",
    isDaily: false,
    difficulty: 3,
  },

  // ═══════════════════════════════════════════
  // 2. EMOTIONAL CONNECTION (정서적 연결) — 12개
  // ═══════════════════════════════════════════

  {
    id: "emo-01",
    title: "매일 감정 체크인",
    description:
      "매일 저녁 서로에게 오늘의 감정 상태를 1-10 점수로 공유하고, 그 이유를 간단히 말해주세요. '오늘 기분 7점, 프로젝트 마감이 잘 끝나서.' 점수가 5 이하이면 '무슨 일이 있었어?'라고 물어봐주세요. 판단 없이 들어주는 것이 핵심입니다.",
    type: "emotional_check_in",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "emotional_connection",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "emo-02",
    title: "취약한 감정 나누기 (EFT 감정 접근)",
    description:
      "오늘 파트너에게 평소 잘 드러내지 않는 감정 하나를 솔직하게 나눠보세요. '사실 요즘 회사에서 능력 없다는 생각이 들어서 무섭다', '네가 바쁠 때 나 혼자 남겨진 것 같아 외로워'. 용기가 필요한 일입니다. 파트너는 '말해줘서 고마워'로 시작하는 반응을 해주세요.",
    type: "vulnerability_sharing",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "emo-03",
    title: "애착 욕구 표현하기 (EFT)",
    description:
      "파트너에게 충족되지 않은 애착 욕구를 표현하세요. 비난이 아닌 욕구의 언어로: '나는 네가 나를 안아줄 때 안전하다고 느껴. 요즘 그런 순간이 적어서 허전해.' 핵심 애착 욕구: 안전감, 소속감, 인정받기, 사랑받기. 어떤 욕구가 가장 절실한지 먼저 혼자 생각해보세요.",
    type: "attachment_needs",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "emo-04",
    title: "부정적 순환 패턴 인식하기 (EFT Cycle Awareness)",
    description:
      "부부 사이에 반복되는 갈등 패턴을 함께 이름 붙여보세요. 예: '나는 네가 늦으면 잔소리 → 너는 방어 → 나는 더 화남 → 너는 침묵 → 나는 외로움'. 이 순환을 종이에 원형으로 그려보세요. 핵심은 서로를 탓하지 않고 '우리가 빠지는 패턴'으로 외재화하는 것입니다.",
    type: "cycle_awareness",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "emo-05",
    title: "6초 포옹",
    description:
      "하루에 최소 한 번, 6초 이상 포옹하세요. Gottman 연구에 따르면 6초 포옹은 옥시토신 분비를 촉진하여 유대감을 강화합니다. 출근 전, 퇴근 후, 또는 잠자기 전 등 루틴으로 만드세요. 어색하면 '6초 포옹 할 시간이야'라고 가볍게 말해보세요.",
    type: "physical_connection",
    conflictLevel: ["mild", "moderate"],
    category: "emotional_connection",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "emo-06",
    title: "정(情) 탐색 대화 (한국 문화 적응)",
    description:
      "파트너와 '정'에 대해 이야기해보세요. 질문: '우리 사이의 정이 가장 깊어진 순간은 언제였어?', '미운 정이 느껴질 때는 언제야?', '정이 식었다고 느끼는 순간은?'. 한국 부부에게 '정'은 사랑과 다른 고유한 감정입니다. 서로가 느끼는 정의 온도를 확인해보세요.",
    type: "cultural_adaptation",
    conflictLevel: ["mild", "moderate"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "emo-07",
    title: "다가가기 신호 알아차리기 (Gottman Turning Toward)",
    description:
      "파트너가 관심을 요청하는 '다가가기 신호'를 하루 3번 이상 알아차리고 반응하세요. 신호 예시: '밖에 비 온다' → (정보가 아닌 대화 초대), '피곤하다' → (공감 요청), '이것 좀 봐' → (관심 공유). '응, 진짜 그러네', '힘들었겠다'처럼 돌아서서 반응해주세요. 무시하거나 '응'만 하지 마세요.",
    type: "turning_toward",
    conflictLevel: ["mild", "moderate"],
    category: "emotional_connection",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "emo-08",
    title: "감정의 빙산 그리기",
    description:
      "최근 갈등 상황에서 느꼈던 감정을 빙산 그림으로 그려보세요. 수면 위(눈에 보이는 감정): 화남, 짜증. 수면 아래(숨은 감정): 두려움, 외로움, 부끄러움, 무력감. 각자 그린 후 파트너에게 수면 아래 감정을 공유하세요. EFT에서 가장 중요한 것은 표면 감정 아래의 1차 감정에 접근하는 것입니다.",
    type: "emotional_awareness",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "emo-09",
    title: "스트레스 줄이는 대화 (Gottman Stress-Reducing Conversation)",
    description:
      "매일 20분, 외부 스트레스에 대해 이야기하세요. 규칙: (1) 관계 문제가 아닌 외부 스트레스만 다루기, (2) 파트너 편에서 듣기, (3) '우리 대 세상' 자세 유지. 직장 상사, 시댁/처가, 친구 문제 등 외부 이야기를 하면서 '우리는 한 팀'이라는 느낌을 강화하세요.",
    type: "stress_reducing",
    conflictLevel: ["mild", "moderate"],
    category: "emotional_connection",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "emo-10",
    title: "인지 재구성 연습 (CBCT)",
    description:
      "파트너의 행동에 대한 부정적 해석을 찾아 대안적 해석으로 바꿔보세요. 노트에 3열로 적으세요: (1) 상황: '파트너가 전화를 안 받음', (2) 자동적 생각: '나를 무시하는 거야', (3) 대안적 해석: '회의 중이거나 바쁠 수 있어'. 매일 부정적 해석 1개를 찾아 변환하세요.",
    type: "cognitive_restructuring",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "emo-11",
    title: "안전한 감정 공간 만들기",
    description:
      "파트너가 감정을 표현할 때 절대 하지 않을 3가지를 서로 약속하세요. 예: (1) '그게 뭐가 힘들어'라고 감정을 축소하지 않기, (2) 화제를 돌리지 않기, (3) '나도 힘든데'로 경쟁하지 않기. 약속을 적어서 냉장고에 붙여두세요.",
    type: "emotional_safety",
    conflictLevel: ["moderate", "severe"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "emo-12",
    title: "행동 교환 목록 (CBCT Behavioral Exchange)",
    description:
      "각자 '파트너가 이것을 해주면 사랑받는 느낌이 든다'는 행동 10가지를 적으세요. 예: 커피 타다주기, 안부 문자, 머리 쓸어주기, 내 이야기에 집중해서 듣기. 목록을 교환하고, 이번 주에 상대 목록에서 매일 1가지씩 실천하세요. 말하지 않아도 알아야 한다는 기대를 내려놓는 연습입니다.",
    type: "behavioral_exchange",
    conflictLevel: ["mild", "moderate"],
    category: "emotional_connection",
    isDaily: false,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 3. CONFLICT MANAGEMENT (갈등 관리) — 12개
  // ═══════════════════════════════════════════

  {
    id: "conf-01",
    title: "타임아웃 프로토콜 (Gottman Self-Soothing)",
    description:
      "갈등이 격해질 때 사용할 타임아웃 규칙을 미리 정하세요. (1) '잠깐 쉬자'라는 신호를 정하기 (손 들기, 특정 단어), (2) 최소 20분 떨어져 있기, (3) 그동안 심호흡이나 산책으로 자기 진정, (4) 돌아와서 '다시 이야기할 준비 됐어'라고 말하기. 핵심: 떠나는 것이 아니라 돌아오기 위해 쉬는 것입니다.",
    type: "de_escalation",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "conf-02",
    title: "수리 시도 연습 (Gottman Repair Attempts)",
    description:
      "갈등 중에 분위기를 바꿀 수 있는 '수리 시도' 문장을 5개 미리 정해두세요. 예: '잠깐, 다시 시작하자', '나 지금 방어적이 되고 있는 것 같아', '네 말이 맞는 부분이 있어', '우리 지금 편이 갈린 것 같아, 같은 편인데', '내가 좀 심했어, 미안해'. 이 문장들을 카드에 적어 눈에 보이는 곳에 두세요.",
    type: "repair_attempt",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "conf-03",
    title: "비판 해독제 — 부드러운 시작 (4 Horsemen Antidote)",
    description:
      "비판(Criticism)이 올라올 때마다 부드러운 시작으로 전환하세요. 비판: '너는 왜 항상 약속을 안 지켜? 무책임해.' → 부드러운 시작: '나는 약속 시간에 너를 기다릴 때 불안해져. 시간 맞춰 와주면 좋겠어.' 오늘 비판하고 싶은 순간이 올 때, 3초 멈추고 '나는...'으로 시작하세요.",
    type: "horsemen_antidote",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "conf-04",
    title: "경멸 해독제 — 감사 문화 만들기 (4 Horsemen Antidote)",
    description:
      "경멸(Contempt)은 이혼의 가장 강력한 예측 지표입니다. 해독제는 존경과 감사의 문화입니다. 이번 주 매일 파트너의 성격적 장점 1가지를 구체적 예시와 함께 말해주세요. 예: '네가 아이들한테 참을성 있게 대하는 거 보면 정말 존경스러워. 어제 아이가 떼쓸 때도 차분하게 대해줬잖아.'",
    type: "horsemen_antidote",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "conf-05",
    title: "방어 해독제 — 책임 인정 (4 Horsemen Antidote)",
    description:
      "방어(Defensiveness)가 올라올 때, 상대 말에서 맞는 부분을 먼저 인정하세요. '네 말이 맞아, 내가 설거지를 미루긴 했어'라고 인정한 후에 자신의 입장을 말하세요. 오늘 파트너가 불만을 표현하면, 반사적으로 변명하기 전에 '맞아, 내가...'으로 시작하는 인정을 1번 이상 해보세요.",
    type: "horsemen_antidote",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "conf-06",
    title: "담쌓기 해독제 — 자기 진정 (4 Horsemen Antidote)",
    description:
      "담쌓기(Stonewalling)는 감정이 과부하될 때 나타나는 자연스러운 반응입니다. 해독제: (1) '나 지금 감정이 과부하야, 20분만 쉬고 올게'라고 말하기, (2) 20분간 심호흡(4초 들이쉬고, 7초 내쉬기) 또는 가벼운 산책, (3) 반드시 돌아와서 대화 재개하기. 침묵으로 벌주는 것과 자기진정은 다릅니다.",
    type: "horsemen_antidote",
    conflictLevel: ["severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "conf-07",
    title: "갈등 지도 그리기",
    description:
      "반복되는 갈등 하나를 골라 다음을 각자 적어보세요: (1) 내 입장과 감정, (2) 양보할 수 없는 핵심 욕구, (3) 유연하게 조정할 수 있는 부분. 서로의 기록을 교환하고, 겹치는 유연 영역에서 타협점을 찾아보세요. Gottman에 따르면 부부 문제의 69%는 해결 불가능한 영속적 문제이며, 관리하는 것이 목표입니다.",
    type: "conflict_mapping",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "conf-08",
    title: "갈등 후 회복 대화 (Gottman Aftermath of a Fight)",
    description:
      "최근 다툼을 진정된 후에 되돌아보세요. 각자 차례로 이야기하세요: (1) 내가 느꼈던 감정, (2) 내 관점에서 무슨 일이 일어났는지, (3) 내가 촉발된 이유(어린 시절 경험과 연결될 수 있음), (4) 내가 책임져야 할 부분, (5) 다음에 더 잘할 수 있는 방법 1가지. 상대를 탓하지 않고 자기 경험만 말하세요.",
    type: "post_conflict",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "conf-09",
    title: "10분 쿨다운 호흡법",
    description:
      "갈등이 격해질 때 혼자 10분간 다음 호흡법을 하세요: (1) 편한 자세로 앉기, (2) 4초 들이쉬기-4초 멈추기-6초 내쉬기를 10회 반복, (3) 심박수가 분당 100회 이상이면 대화를 멈춰야 합니다(손목으로 확인). Gottman 연구: 심박수가 높아지면 이성적 대화가 불가능합니다.",
    type: "self_soothing",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "conf-10",
    title: "시댁/처가 갈등 경계 설정 (한국 문화 적응)",
    description:
      "시댁/처가 관련 갈등이 있다면, 부부만의 경계선을 함께 정하세요. (1) '우리 부부의 결정은 우리가 한다'는 원칙 확인, (2) 각자 부모님에게는 각자가 이야기하기, (3) 명절/가족 모임 일정은 미리 둘이 합의하기, (4) 부모님 앞에서 파트너를 비난하지 않기. 가장 시급한 경계선 1개를 이번 주에 실행해보세요.",
    type: "cultural_adaptation",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "conf-11",
    title: "갈등 일지 작성",
    description:
      "갈등이 생겼을 때 바로 기록하세요: (1) 날짜/시간, (2) 촉발 상황 (무엇이 발생했나), (3) 내 감정 (표면 + 깊은 감정), (4) 내 반응 (내가 한 말/행동), (5) 상대의 감정(추측), (6) 4 Horsemen 중 나타난 것이 있는지. 일주일 후 패턴을 찾아보세요.",
    type: "reflection",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "conf-12",
    title: "타협 원 그리기 (Gottman Two-Circle Method)",
    description:
      "갈등 주제 하나를 정하고, 각자 두 개의 원을 그리세요. 안쪽 원: 절대 양보할 수 없는 핵심 욕구. 바깥 원: 유연하게 조정 가능한 부분. 서로의 원을 보면서, 바깥 원끼리 겹치는 영역에서 타협안 3가지를 만들어보세요.",
    type: "compromise",
    conflictLevel: ["moderate", "severe"],
    category: "conflict_management",
    isDaily: false,
    difficulty: 2,
  },

  // ═══════════════════════════════════════════
  // 4. GRATITUDE & APPRECIATION (감사/존경) — 10개
  // ═══════════════════════════════════════════

  {
    id: "grat-01",
    title: "매일 감사 한 가지 표현하기",
    description:
      "파트너에게 감사한 점 1가지를 직접 말로 표현하세요. 구체적일수록 좋습니다. '고마워'보다 '오늘 내가 피곤할 때 아이 재워줘서 고마워. 덕분에 쉴 수 있었어.'가 훨씬 효과적입니다. 잠자리에 들기 전이 좋은 시간입니다.",
    type: "gratitude",
    conflictLevel: ["mild", "moderate"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-02",
    title: "감사 일기 (5:1 비율 만들기)",
    description:
      "Gottman 연구에 따르면 행복한 부부는 긍정적 상호작용과 부정적 상호작용의 비율이 5:1입니다. 매일 파트너에 대해 감사한 점 3가지를 노트에 적으세요. 일주일 후 함께 읽어보세요. 이 습관이 긍정적 관점(Positive Perspective)을 만들어 갈등 면역력을 높입니다.",
    type: "gratitude",
    conflictLevel: ["mild", "moderate"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-03",
    title: "호감과 존경 표현 (Gottman Fondness & Admiration)",
    description:
      "파트너의 성격적 장점을 구체적 사례와 함께 말해주세요. '네가 좋아'가 아닌 '네가 어려운 상황에서도 유머를 잃지 않는 점이 정말 존경스러워. 지난주 차가 고장났을 때도 웃으면서 대처하는 거 보고 놀랐어.' 매일 1가지씩 실천하세요.",
    type: "fondness_admiration",
    conflictLevel: ["mild", "moderate"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-04",
    title: "긍정적 스캐닝 연습",
    description:
      "하루 동안 파트너의 긍정적인 행동을 의식적으로 찾아보세요. 출근 준비, 집안일, 아이 돌봄, 작은 배려 등 당연하게 여겼던 것들을 새삼 알아차리세요. 저녁에 3가지 이상을 말해주세요. 부정적 필터를 긍정적 필터로 바꾸는 인지 훈련입니다.",
    type: "positive_scanning",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-05",
    title: "감사 편지 쓰기",
    description:
      "파트너에게 감사 편지를 쓰세요. 최소 A4 1장 분량으로, (1) 처음 만났을 때의 기억, (2) 파트너 덕분에 내가 성장한 점, (3) 지금 가장 감사한 것 3가지, (4) 앞으로 함께 하고 싶은 것. 직접 손으로 쓰면 더 좋습니다. 완성 후 직접 읽어주거나 눈에 띄는 곳에 두세요.",
    type: "gratitude",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "gratitude_appreciation",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "grat-06",
    title: "파트너 자랑하기",
    description:
      "이번 주 중 다른 사람(친구, 가족, 동료) 앞에서 파트너를 자랑하세요. 파트너가 들을 수 있는 곳에서 하면 더 좋습니다. '우리 남편/와이프가 요리를 정말 잘해요' 같은 간단한 것도 괜찮아요. 제3자 앞에서의 칭찬은 직접 하는 칭찬보다 체감 효과가 큽니다.",
    type: "fondness_admiration",
    conflictLevel: ["mild"],
    category: "gratitude_appreciation",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "grat-07",
    title: "'당신 덕분에' 문장 만들기",
    description:
      "매일 '당신 덕분에 나는 ___' 문장을 하나씩 만들어 파트너에게 공유하세요. 예: '당신 덕분에 나는 퇴근 후 집에 오는 게 즐거워', '당신 덕분에 나는 부모가 되는 게 덜 무서워'. 카톡으로 보내도 좋고, 직접 말해도 좋습니다.",
    type: "gratitude",
    conflictLevel: ["mild", "moderate"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-08",
    title: "긍정적 기억 되살리기",
    description:
      "함께 사진첩이나 옛날 사진을 보면서, 행복했던 순간 5개를 골라 그때 느꼈던 감정을 서로 나누세요. '이때 정말 행복했어', '이 순간 네가 이래서 좋았어'. Gottman 연구: 과거를 긍정적으로 회상하는 부부가 관계 회복 가능성이 높습니다.",
    type: "fondness_admiration",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "gratitude_appreciation",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "grat-09",
    title: "감사 알람 설정",
    description:
      "핸드폰 알람을 하루 3번(아침, 점심, 저녁) 설정하세요. 알람이 울릴 때마다 파트너에 대해 감사한 점 1가지를 떠올리고, 그중 1번은 직접 전달하세요. 카톡으로 '고마워요 ❤️'만 보내도 됩니다. 21일간 지속하면 습관이 됩니다.",
    type: "gratitude",
    conflictLevel: ["mild"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "grat-10",
    title: "노력 알아봐주기",
    description:
      "파트너가 변화하려고 노력하는 점을 구체적으로 인정해주세요. 결과가 아닌 과정을 칭찬하세요. 예: '요즘 일찍 들어오려고 노력하는 거 알아. 아직 완벽하진 않아도, 그 마음이 고마워.' 작은 변화도 놓치지 않고 알아봐주는 것이 변화를 지속시키는 핵심입니다.",
    type: "affirmation",
    conflictLevel: ["moderate", "severe"],
    category: "gratitude_appreciation",
    isDaily: true,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 5. QUALITY TIME (함께하는 시간) — 10개
  // ═══════════════════════════════════════════

  {
    id: "qt-01",
    title: "핸드폰 없는 식사",
    description:
      "이번 주 중 최소 3회, 식사할 때 핸드폰을 다른 방에 두세요. 식사하는 동안 서로의 하루, 재미있었던 일, 고민을 나누세요. 주제가 없으면: '오늘 가장 좋았던 순간은?', '이번 주 가장 기대되는 일은?' 같은 질문으로 시작하세요.",
    type: "quality_time",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-02",
    title: "주간 데이트 나이트",
    description:
      "매주 한 번, 둘만의 데이트 시간을 정하세요. 번갈아 계획을 세우세요. 돈을 많이 쓸 필요 없습니다. 동네 산책, 카페, 영화, 요리 같이 하기 등 무엇이든 좋아요. 핵심: 아이나 가족 이야기를 하지 않고, 연인으로서의 시간을 보내는 것입니다.",
    type: "quality_time",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-03",
    title: "함께 산책하기",
    description:
      "30분 이상 함께 걸으며 대화하세요. 주제는 갈등이 아닌 좋았던 기억, 미래 계획, 또는 가벼운 이야기로. 나란히 걸으면 눈을 마주치지 않아도 되어 어려운 이야기가 더 쉬워지는 효과도 있습니다. 주 2회 이상 실천해보세요.",
    type: "quality_time",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-04",
    title: "새로운 경험 함께 하기",
    description:
      "이번 주에 둘 다 해본 적 없는 활동을 함께 하세요. 새로운 음식 만들기, 처음 가는 곳 방문, 새로운 취미 시도 등. 연구에 따르면 함께하는 새로운 경험은 초기 연애 시절의 설렘과 유사한 도파민 반응을 일으킵니다.",
    type: "shared_activity",
    conflictLevel: ["mild"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-05",
    title: "취침 전 10분 의식",
    description:
      "매일 잠자기 전 10분을 둘만의 시간으로 만드세요. 핸드폰은 충전기에 꽂아두고, 침대에서 오늘 하루 감사한 점 1가지와 내일 기대되는 것 1가지를 나누세요. 이 루틴이 하루의 마무리를 긍정적으로 만들어줍니다.",
    type: "daily_ritual",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "qt-06",
    title: "환영/작별 의식 만들기 (Gottman Rituals of Connection)",
    description:
      "출근할 때와 퇴근할 때의 인사를 의식적으로 만드세요. 출근: 6초 포옹 + '오늘 하루도 잘 보내' + 가벼운 입맞춤. 퇴근: 하던 일 멈추고 눈 맞추며 '어서 와, 오늘 어땠어?' Gottman 연구: 이 작은 의식이 관계 안정감에 큰 영향을 미칩니다.",
    type: "daily_ritual",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "qt-07",
    title: "함께 요리하기",
    description:
      "이번 주에 한 번, 둘이 함께 요리하세요. 새로운 레시피를 찾아서 역할을 나누세요. 요리하는 과정에서 자연스럽게 대화가 생기고, 완성된 음식을 함께 먹으며 성취감을 나눌 수 있습니다. 과정이 중요하니 완벽하지 않아도 괜찮아요.",
    type: "shared_activity",
    conflictLevel: ["mild"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-08",
    title: "디지털 디톡스 데이",
    description:
      "이번 주 하루를 정해서 둘 다 SNS와 유튜브를 하지 않기로 약속하세요. 그 시간에 함께할 수 있는 활동(보드게임, 산책, 대화, 책 읽기)을 미리 계획하세요. 디지털 기기가 파트너에 대한 관심을 얼마나 분산시키는지 체감할 수 있습니다.",
    type: "quality_time",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "qt-09",
    title: "공유된 의미 만들기 (Gottman Shared Meaning)",
    description:
      "부부만의 의식(Ritual)을 하나 만드세요. 예: 매주 금요일 저녁은 치킨 데이, 기념일마다 처음 만난 장소 방문, 매달 첫째 주 새로운 카페 탐방. 큰 것이 아니어도 됩니다. 핵심은 '우리만의 것'이라는 소속감과 정체성을 만드는 것입니다.",
    type: "shared_meaning",
    conflictLevel: ["mild"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "qt-10",
    title: "서로의 세계에 참여하기",
    description:
      "파트너가 좋아하는 활동에 관심을 갖고 함께해보세요. 파트너가 좋아하는 드라마를 같이 보거나, 취미에 동행하거나, 관심사에 대해 질문하세요. 내가 좋아서가 아닌, 파트너가 좋아하기 때문에 함께하는 것이 사랑의 표현입니다.",
    type: "turning_toward",
    conflictLevel: ["mild", "moderate"],
    category: "quality_time",
    isDaily: false,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 6. INTIMACY (친밀감) — 10개
  // ═══════════════════════════════════════════

  {
    id: "intim-01",
    title: "의미 있는 스킨십",
    description:
      "하루 1회 이상 의미 있는 신체 접촉을 하세요. 지나가면서 어깨 두드리기, 소파에서 나란히 앉을 때 손 잡기, 뒤에서 안아주기, 이마에 입맞춤. 갑자기 하면 어색할 수 있으니, 자연스러운 순간을 포착하세요. TV 볼 때, 요리할 때, 잠자기 전 등.",
    type: "physical_affection",
    conflictLevel: ["mild", "moderate"],
    category: "intimacy",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "intim-02",
    title: "사랑의 언어 탐색",
    description:
      "5가지 사랑의 언어(인정의 말, 봉사의 행위, 선물, 함께하는 시간, 스킨십) 중 각자 가장 중요한 것 2가지를 고르세요. 파트너에게 '나는 이렇게 사랑을 느껴'라고 구체적으로 알려주세요. 이번 주에 파트너의 사랑 언어로 1가지씩 매일 표현해보세요.",
    type: "love_languages",
    conflictLevel: ["mild", "moderate"],
    category: "intimacy",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "intim-03",
    title: "36가지 질문 (Arthur Aron)",
    description:
      "관계 친밀감을 높이는 Aron 교수의 36가지 질문 중 매일 3개씩 주고받으세요. 예: '세상 누구든 저녁 식사에 초대할 수 있다면?', '완벽한 하루는 어떤 모습이야?', '가장 감사한 기억은?', '가족 관계에서 바꾸고 싶은 것은?', '죽기 전에 꼭 하고 싶은 것은?'. 대답에 후속 질문으로 더 깊이 들어가세요.",
    type: "emotional_intimacy",
    conflictLevel: ["mild", "moderate"],
    category: "intimacy",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "intim-04",
    title: "서로에게 편지 쓰기",
    description:
      "파트너에게 솔직한 마음을 담은 편지를 쓰세요. 주제: 요즘 내가 느끼는 감정, 파트너에게 고마운 점, 미안한 점, 바라는 점. 완성된 편지는 직접 전달하거나, 파트너 가방/베개 아래에 두세요. 손으로 쓰면 디지털 메시지보다 진심이 더 전달됩니다.",
    type: "emotional_intimacy",
    conflictLevel: ["mild", "moderate", "severe"],
    category: "intimacy",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "intim-05",
    title: "비성적 친밀감 시간",
    description:
      "이번 주 2회, 성적 기대 없이 30분간 가까이 있는 시간을 가지세요. 소파에서 함께 기대어 앉기, 등 마사지 교환, 손을 잡고 음악 듣기. 성적 친밀감에 부담을 느끼는 경우, 비성적 접촉부터 신뢰를 쌓는 것이 중요합니다.",
    type: "physical_affection",
    conflictLevel: ["moderate", "severe"],
    category: "intimacy",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "intim-06",
    title: "서로의 꿈 지지하기 (Gottman Honor Each Other's Dreams)",
    description:
      "파트너에게 요즘 꿈이나 소망이 무엇인지 물어보세요. 진로 변경, 취미, 여행, 자기계발 등 무엇이든. 실현 가능성을 따지지 말고, '그 꿈 멋지다. 내가 어떻게 도와줄 수 있을까?'라고 반응하세요. 서로의 꿈을 지지하는 것이 깊은 유대의 기초입니다.",
    type: "dream_support",
    conflictLevel: ["mild", "moderate"],
    category: "intimacy",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "intim-07",
    title: "감정적 친밀감 질문",
    description:
      "오늘 밤 파트너에게 다음 중 하나를 물어보세요: '요즘 나에게 바라는 게 있어?', '내가 모르는 네 걱정이 있어?', '요즘 가장 외로울 때는 언제야?', '나한테 말하고 싶었는데 못한 게 있어?' 대답을 들으면 '말해줘서 고마워'로 반응하세요.",
    type: "emotional_intimacy",
    conflictLevel: ["moderate", "severe"],
    category: "intimacy",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "intim-08",
    title: "추억 여행",
    description:
      "처음 만난 날, 첫 데이트, 프러포즈 등 특별한 순간의 장소를 다시 방문하거나 사진을 보며 그때를 이야기해보세요. 각자의 기억이 다를 수 있는데, 그 차이도 재미있게 나누세요. '나는 그때 이런 감정이었어'라고 감정을 중심으로 공유하세요.",
    type: "relationship_building",
    conflictLevel: ["mild"],
    category: "intimacy",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "intim-09",
    title: "신체 친밀감 대화",
    description:
      "파트너와 신체 접촉에 대한 선호를 솔직하게 나누세요. '나는 이런 접촉이 좋아', '이런 상황에서는 접촉이 부담스러워', '이렇게 해주면 안전하게 느껴져'. 비난이 아닌 선호의 언어로 이야기하세요. 한국 문화에서 잘 나누지 않는 주제이지만, 오해를 줄이는 데 매우 중요합니다.",
    type: "physical_affection",
    conflictLevel: ["moderate"],
    category: "intimacy",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "intim-10",
    title: "하루 끝 재연결 의식",
    description:
      "하루를 마무리하면서 파트너와 눈을 마주치고 '오늘 하루도 함께해줘서 고마워요'라고 말하세요. 2분간 서로 눈을 보며 아무 말 없이 있어보는 것도 좋습니다. 어색할 수 있지만, 비언어적 연결이 말보다 강력할 때가 있습니다.",
    type: "daily_ritual",
    conflictLevel: ["mild", "moderate"],
    category: "intimacy",
    isDaily: true,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 7. SELF REFLECTION (자기 성찰) — 11개
  // ═══════════════════════════════════════════

  {
    id: "ref-01",
    title: "원가족 탐색 (Family of Origin)",
    description:
      "부모님의 관계 패턴이 나에게 어떤 영향을 미쳤는지 적어보세요. 질문: (1) 부모님은 갈등을 어떻게 다뤘나요?, (2) 그것이 내 갈등 방식에 어떤 영향을 줬나요?, (3) 부모님에게서 배운 관계 규칙은?, (4) 그중 내가 반복하고 싶지 않은 패턴은? 파트너와 공유하면 서로의 반응을 더 잘 이해할 수 있습니다.",
    type: "self_reflection",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "ref-02",
    title: "내 갈등 패턴 인식하기",
    description:
      "최근 반복되는 갈등 상황 3가지를 적고, 다음을 분석하세요: (1) 공통 촉발점은?, (2) 내가 항상 하는 반응은?(공격, 회피, 얼어붙기), (3) 그 반응의 목적은?(자기 보호, 관심 끌기, 통제), (4) 그 반응이 원하는 결과를 가져오나? 패턴을 인식하는 것이 변화의 첫 단계입니다.",
    type: "pattern_recognition",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "ref-03",
    title: "파트너 관점에서 편지 쓰기",
    description:
      "최근 갈등 상황을 파트너의 시각에서 편지로 써보세요. '나는 [파트너 이름]이고, 그때 나는...'으로 시작하세요. 파트너의 감정, 생각, 두려움을 최대한 상상하며 쓰세요. 이 연습은 공감 능력을 키우고, 자신의 행동이 파트너에게 어떤 영향을 미치는지 깨닫게 합니다.",
    type: "perspective_taking",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "ref-04",
    title: "관계 비전 작성",
    description:
      "5년 후 우리 관계가 어떤 모습이길 바라는지 각자 A4 1장에 적어보세요. 포함할 것: 일상의 모습, 갈등을 다루는 방식, 서로에게 해주고 싶은 것, 함께 이루고 싶은 것. 적은 후 교환하여 읽고, 겹치는 부분과 다른 부분에 대해 대화하세요.",
    type: "vision_setting",
    conflictLevel: ["mild"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "ref-05",
    title: "관계 선언문 작성",
    description:
      "두 사람이 함께 지켜갈 관계 약속 5가지를 정하고 서로 서명하세요. 예: '우리는 화가 나도 경멸하지 않는다', '우리는 매일 감사를 표현한다', '우리는 각자의 시간을 존중한다'. 이 선언문을 눈에 보이는 곳에 걸어두세요.",
    type: "commitment",
    conflictLevel: ["mild", "moderate"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "ref-06",
    title: "감정 일기 쓰기",
    description:
      "매일 5분간 오늘 느낀 감정을 기록하세요. (1) 오늘 가장 강렬했던 감정은?, (2) 그 감정의 촉발점은?, (3) 신체에서 어디에 느껴졌나?(가슴, 목, 어깨 등), (4) 그 감정을 파트너에게 표현했나?, (5) 표현했다면 어떻게? 안 했다면 왜? 감정 인식이 감정 조절의 첫 단계입니다.",
    type: "journaling",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "ref-07",
    title: "나의 애착 유형 이해하기",
    description:
      "자신의 애착 유형(안정, 불안, 회피, 혼란)에 대해 탐색해보세요. 질문: (1) 파트너가 멀어질 때 나는 어떻게 반응하나?(매달리기 vs 무관심한 척), (2) 친밀해질 때 불편한가?, (3) 파트너의 사랑을 믿기 어려운가? 자신의 패턴을 인식하고, 파트너와 나의 애착 유형이 어떻게 상호작용하는지 이야기해보세요.",
    type: "attachment_awareness",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "ref-08",
    title: "자동적 사고 기록 (CBCT)",
    description:
      "파트너에 대한 부정적 자동적 사고가 떠오를 때 기록하세요: (1) 상황, (2) 자동적 사고 ('걔는 나를 무시해'), (3) 그 생각의 근거, (4) 반박 근거, (5) 균형 잡힌 생각 ('바빠서 못 본 것일 수 있어'). 일주일간 매일 1개 이상 기록하세요.",
    type: "cognitive_restructuring",
    conflictLevel: ["moderate", "severe"],
    category: "self_reflection",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "ref-09",
    title: "가치관 정렬 대화",
    description:
      "다음 영역에서 각자의 가치관을 1-10 중요도로 평가하고 비교하세요: 돈, 직업, 자녀 교육, 여가, 종교/영성, 확대가족, 건강, 사회활동, 개인 성장, 부부 시간. 차이가 큰 영역에 대해 '왜 이게 나에게 중요한지' 이야기를 나누세요.",
    type: "values_exploration",
    conflictLevel: ["mild", "moderate"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "ref-10",
    title: "성역할 기대 점검 (한국 문화 적응)",
    description:
      "한국 사회의 성역할 기대가 우리 관계에 어떤 영향을 미치는지 각자 적어보세요. 질문: (1) '남편/아내는 당연히 ~해야 한다'고 생각하는 것이 있나요?, (2) 그 기대는 어디서 왔나요?(부모, 사회, 미디어), (3) 그 기대가 파트너에게 부담을 주고 있진 않나요? 서로의 기대를 조율해보세요.",
    type: "cultural_adaptation",
    conflictLevel: ["moderate"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "ref-11",
    title: "강점 인벤토리",
    description:
      "각자 우리 관계의 강점 5가지를 적어보세요. 예: 유머 감각, 경제적 안정, 서로의 가족과의 관계, 위기 때 뭉치는 힘, 공통 취미. 적은 후 교환하고, 이 강점을 어떻게 더 키울 수 있을지 이야기하세요. 문제에만 집중하면 관계의 좋은 면을 놓치게 됩니다.",
    type: "strength_building",
    conflictLevel: ["mild", "moderate"],
    category: "self_reflection",
    isDaily: false,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 8. PARENTING (공동 양육) — 8개
  // ═══════════════════════════════════════════

  {
    id: "par-01",
    title: "양육 원칙 통일하기",
    description:
      "아이 훈육에 대한 각자의 기준을 5가지 적어보세요. 예: TV 시청 시간, 용돈, 숙제 관리, 잠자는 시간, 핸드폰 사용. 차이가 있는 항목은 아이 앞에서가 아닌 둘만 있을 때 조율하세요. 핵심: 아이 앞에서는 한 목소리를 내는 것입니다.",
    type: "co_parenting",
    conflictLevel: ["mild", "moderate"],
    category: "parenting",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "par-02",
    title: "부부 시간 vs 부모 시간 구분하기",
    description:
      "이번 주에 '부부로서의 시간'을 최소 1시간 확보하세요. 아이 재운 후 30분이라도 아이 이야기가 아닌 둘의 이야기를 하세요. 부모 역할에만 몰두하면 부부 관계가 소외됩니다. '오늘 우리 이야기 좀 하자'라고 먼저 제안해보세요.",
    type: "co_parenting",
    conflictLevel: ["mild", "moderate"],
    category: "parenting",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "par-03",
    title: "아이 관점에서 보기",
    description:
      "부부 갈등이 아이에게 어떤 영향을 미치는지 함께 대화하세요. 질문: (1) 우리가 싸울 때 아이가 어떤 표정을 지었나?, (2) 아이가 우리 관계를 어떻게 느끼고 있을까?, (3) 우리가 아이 앞에서 고칠 수 있는 것 1가지는? 아이를 위해서라도 갈등 표현 방식을 개선하는 동기가 됩니다.",
    type: "co_parenting",
    conflictLevel: ["moderate", "severe"],
    category: "parenting",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "par-04",
    title: "양육 역할 재분배",
    description:
      "이번 주 양육 관련 모든 업무를 목록으로 적고(아침 준비, 등원, 숙제 도움, 목욕, 재우기 등), 현재 누가 주로 하는지 표시하세요. 불균형이 있다면 공정하게 재분배하세요. 매주 1회 점검하여 한쪽에 과부하가 걸리지 않도록 하세요.",
    type: "co_parenting",
    conflictLevel: ["moderate"],
    category: "parenting",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "par-05",
    title: "아이 앞 갈등 규칙 정하기",
    description:
      "아이 앞에서의 갈등 표현에 대한 규칙을 3가지 이상 정하세요. 예: (1) 아이 앞에서 소리 지르지 않기, (2) 아이를 편 가르기에 이용하지 않기 ('엄마/아빠한테 가'), (3) 갈등 후 아이 앞에서 화해하는 모습 보여주기. 건강한 갈등 해결 모델링이 아이의 정서 발달에 중요합니다.",
    type: "co_parenting",
    conflictLevel: ["moderate", "severe"],
    category: "parenting",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "par-06",
    title: "함께하는 가족 시간",
    description:
      "이번 주에 가족 전체가 함께하는 활동 1가지를 계획하세요. 이때 부부가 협력하는 모습을 자연스럽게 보여주세요. 예: 함께 요리할 때 역할을 나누고 서로 칭찬하기, 산책할 때 손잡고 걷기. 아이가 부모의 긍정적 상호작용을 보는 것이 중요합니다.",
    type: "family_activity",
    conflictLevel: ["mild"],
    category: "parenting",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "par-07",
    title: "조부모/시댁 양육 개입 경계 설정",
    description:
      "시댁이나 처가에서 양육에 과도하게 개입하는 경우, 부부가 통일된 입장을 먼저 정하세요. (1) 감사하게 받을 조언의 영역, (2) 정중히 거절할 영역을 구분하세요. 각자 자기 부모에게 전달하는 것이 원칙입니다. 파트너가 직접 시부모/장인장모에게 말하게 하지 마세요.",
    type: "cultural_adaptation",
    conflictLevel: ["moderate", "severe"],
    category: "parenting",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "par-08",
    title: "양육 감사 표현하기",
    description:
      "파트너의 양육 노력을 구체적으로 인정해주세요. '아이 잘 키우네' 같은 일반적 칭찬이 아닌, '오늘 아이가 숙제 싫다고 떼쓸 때 참을성 있게 기다려준 거 정말 대단해. 나였으면 화냈을 거야.' 매일 양육 관련 감사 1가지를 표현하세요.",
    type: "gratitude",
    conflictLevel: ["mild", "moderate"],
    category: "parenting",
    isDaily: true,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 9. TRUST REBUILDING (신뢰 재건) — 8개
  // ═══════════════════════════════════════════

  {
    id: "trust-01",
    title: "일일 투명성 연습",
    description:
      "신뢰가 깨진 후에는 의도적인 투명성이 필요합니다. 매일 파트너에게 오늘의 일정을 간단히 공유하고, 예상치 못한 변동이 생기면 먼저 알려주세요. '오늘 회식이 생겨서 9시쯤 갈게'처럼. 감시가 아닌, 자발적 공유입니다. 신뢰 재건에는 시간이 걸리므로 인내심을 가지세요.",
    type: "transparency",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "trust-02",
    title: "약속 지키기 트래킹",
    description:
      "이번 주 파트너에게 한 약속을 모두 기록하세요. 아무리 작은 것이라도(전화하겠다, 빨래 널겠다, 7시에 오겠다). 주말에 함께 체크하세요. 100% 지키는 것이 목표입니다. 작은 약속을 지키는 것이 큰 신뢰를 쌓습니다. 지키기 어려운 약속은 처음부터 하지 마세요.",
    type: "consistency",
    conflictLevel: ["moderate", "severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "trust-03",
    title: "책임 인정 편지",
    description:
      "파트너에게 상처를 준 행동에 대해 책임을 인정하는 편지를 쓰세요. 포함할 것: (1) 내가 한 행동을 구체적으로 인정, (2) 그것이 파트너에게 어떤 영향을 미쳤는지 인식, (3) 변명이나 정당화 없이 진심으로 미안하다는 표현, (4) 앞으로의 구체적 행동 약속. 방어하지 마세요.",
    type: "accountability",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "trust-04",
    title: "감정 확인하기 (신뢰 상처를 준 쪽)",
    description:
      "파트너가 아직 아파하고 있다면, 매일 한 번 '요즘 기분이 어때? 아직 힘든 게 있으면 이야기해줘'라고 물어보세요. 파트너가 같은 이야기를 반복해도 짜증내지 마세요. 신뢰 회복은 선형적이지 않습니다. 좋아졌다가 나빠질 수 있고, 그것은 정상입니다.",
    type: "emotional_support",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: true,
    difficulty: 2,
  },
  {
    id: "trust-05",
    title: "안전 신호 만들기",
    description:
      "불안이 올라올 때 파트너에게 안전하게 전달할 수 있는 신호를 정하세요. 예: '나 지금 불안해' 또는 미리 정한 이모지를 카톡으로 보내기. 신호를 받은 파트너는 즉시 안심시키는 반응을 하세요: '나 여기 있어, 괜찮아'. 불안을 말할 수 있는 통로가 있는 것만으로도 안정감이 커집니다.",
    type: "safety_building",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "trust-06",
    title: "신뢰 재건 로드맵 만들기",
    description:
      "함께 신뢰 재건의 단계별 계획을 세우세요: (1) 현재 신뢰 수준을 1-10으로 평가, (2) 6개월 목표를 정하기, (3) 구체적 실천 항목 5가지 정하기(예: 매일 위치 공유, 주 1회 감정 대화, 비밀번호 공유 등), (4) 매달 진전을 점검하기. 한쪽만의 노력이 아닌 함께 만드는 계획이어야 합니다.",
    type: "trust_roadmap",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "trust-07",
    title: "용서 과정 탐색",
    description:
      "용서는 한 번에 일어나지 않습니다. 현재 자신이 어느 단계인지 인식해보세요: (1) 상처 인정, (2) 분노 느끼기, (3) 의미 찾기 (왜 이런 일이 생겼나), (4) 결정 (용서를 선택할 것인가), (5) 점진적 놓아줌. 지금 단계를 파트너에게 솔직하게 알려주세요. 용서를 강요하지 마세요.",
    type: "forgiveness",
    conflictLevel: ["severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "trust-08",
    title: "새로운 긍정 경험 쌓기",
    description:
      "신뢰가 깨진 후 새로운 긍정적 경험을 의도적으로 쌓으세요. 이번 주 파트너가 기뻐할 작은 행동 3가지를 하세요: 좋아하는 간식 사오기, 집안일 미리 해두기, 좋아하는 음악 틀어놓기 등. 말보다 행동이 신뢰를 쌓습니다. 꾸준함이 핵심입니다.",
    type: "positive_experience",
    conflictLevel: ["moderate", "severe"],
    category: "trust_rebuilding",
    isDaily: false,
    difficulty: 1,
  },

  // ═══════════════════════════════════════════
  // 10. CRISIS & SAFETY (위기/안전) — 8개
  // ═══════════════════════════════════════════

  {
    id: "crisis-01",
    title: "자기 진정 도구 상자 만들기",
    description:
      "감정이 폭발할 때 사용할 수 있는 '자기 진정 도구 상자'를 미리 만드세요. 포함할 것: (1) 심호흡법(4-7-8 호흡), (2) 감각 접지(5가지 감각으로 현재에 집중), (3) 신체 활동(산책, 스트레칭), (4) 안전한 사람에게 전화하기, (5) 좋아하는 음악 듣기. 목록을 핸드폰 메모에 저장하세요.",
    type: "self_soothing",
    conflictLevel: ["moderate", "severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "crisis-02",
    title: "안전 공간 정하기",
    description:
      "감정이 격해질 때 각자 갈 수 있는 '안전 공간'을 미리 정하세요. 집 안의 특정 방, 근처 카페, 공원 벤치 등 물리적으로 떨어져서 진정할 수 있는 곳이면 됩니다. '안전 공간에 간다'는 것은 도망이 아닌 자기 조절이라는 의미를 서로 확인하세요.",
    type: "safety_planning",
    conflictLevel: ["severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "crisis-03",
    title: "경계선 3가지 정하기",
    description:
      "서로에게 '이것만은 하지 말아줘'라는 경계선 3가지를 각자 정하고 공유하세요. 예: '큰 소리로 말하지 않기', '과거 잘못 들추지 않기', '이혼이라는 단어 쓰지 않기'. 경계선은 서로를 벌주기 위한 것이 아닌, 관계를 안전하게 지키기 위한 울타리입니다.",
    type: "boundary_setting",
    conflictLevel: ["severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "crisis-04",
    title: "전문가 상담 탐색",
    description:
      "지역 부부상담 전문가를 3곳 이상 찾아보세요. 한국가족치료학회(kaft.or.kr), 한국상담심리학회(krcpa.or.kr) 홈페이지에서 인증 상담사를 검색할 수 있습니다. 각 상담소의 위치, 비용, 전문 분야를 비교하고, 가능하면 초기 상담을 예약해보세요. 앱은 보조 도구이며, 심각한 문제는 전문가의 도움이 필요합니다.",
    type: "professional_referral",
    conflictLevel: ["severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 2,
  },
  {
    id: "crisis-05",
    title: "위기 자원 목록 만들기",
    description:
      "위기 상황에 연락할 수 있는 번호를 핸드폰에 저장하세요: 여성긴급전화 1366, 정신건강위기상담전화 1577-0199, 자살예방상담전화 1393, 가정폭력상담 1366. 가까운 친구나 가족 중 위급할 때 연락할 사람 2명도 정해두세요. 위기는 예고 없이 옵니다.",
    type: "safety_planning",
    conflictLevel: ["severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 1,
  },
  {
    id: "crisis-06",
    title: "감정 온도계 체크",
    description:
      "대화 중 감정 강도를 0-10으로 수시로 체크하세요. 7을 넘으면 즉시 타임아웃을 선언하세요. '나 지금 7이야, 쉬자'라고만 말하면 됩니다. 파트너가 7이라고 하면 무조건 존중하세요. 감정 온도가 높을 때의 대화는 해결이 아닌 상처만 남깁니다.",
    type: "de_escalation",
    conflictLevel: ["moderate", "severe"],
    category: "crisis_safety",
    isDaily: true,
    difficulty: 1,
  },
  {
    id: "crisis-07",
    title: "분리 고려 시 냉각기 규칙",
    description:
      "이별/이혼을 고려하고 있다면, 감정이 격한 상태에서 결정하지 마세요. 규칙: (1) 최소 1개월의 냉각기 갖기, (2) 그동안 전문 상담 최소 4회 받기, (3) 서로에 대한 기대와 두려움을 각자 적어보기, (4) 1개월 후 냉정한 상태에서 대화하기. 후회 없는 결정을 위한 시간입니다.",
    type: "crisis_management",
    conflictLevel: ["severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 3,
  },
  {
    id: "crisis-08",
    title: "5-4-3-2-1 감각 접지법",
    description:
      "감정이 과부하될 때 즉시 실행하세요: 눈으로 보이는 것 5가지, 만질 수 있는 것 4가지, 들리는 것 3가지, 냄새 맡을 수 있는 것 2가지, 맛볼 수 있는 것 1가지를 찾으세요. 이 기법은 감정의 소용돌이에서 현재로 돌아오게 합니다. 2분이면 충분합니다.",
    type: "grounding",
    conflictLevel: ["moderate", "severe"],
    category: "crisis_safety",
    isDaily: false,
    difficulty: 1,
  },
];

/**
 * 갈등 수준에 맞는 과제 목록 필터링
 */
export function getAssignmentsForLevel(level: ConflictLevel): AssignmentTemplate[] {
  return ASSIGNMENT_POOL.filter((a) => a.conflictLevel.includes(level));
}

/**
 * 카테고리별 과제 필터링
 */
export function getAssignmentsByCategory(category: string): AssignmentTemplate[] {
  return ASSIGNMENT_POOL.filter((a) => a.category === category);
}

/**
 * 프롬프트에 주입할 과제 목록 텍스트 생성
 */
export function formatAssignmentPoolForPrompt(level: ConflictLevel): string {
  const filtered = getAssignmentsForLevel(level);
  const lines = filtered.map(
    (a) => `- [${a.id}] ${a.title}: ${a.description} (유형: ${a.type}, 카테고리: ${a.category}, 난이도: ${a.difficulty}/3, ${a.isDaily ? "일일" : "주간"})`
  );

  return `현재 이 커플의 갈등 수준은 "${level}"입니다.
아래 과제 풀에서 대화 맥락에 가장 적합한 과제를 골라 제안하세요:

${lines.join("\n")}

과제를 제안할 때 반드시 위 목록의 id, title, description, type을 그대로 사용하세요.
한 번에 1-2개씩, 대화 맥락에 맞는 것만 제안하세요.`;
}
