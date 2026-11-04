/**
 * 오프라인 모드: Claude 키가 없을 때도 시스템 흐름을 체험할 수 있도록
 * 규칙 기반으로 카드를 만든다. (숫자 포착, 기술 용어 사전, 내 자료 매칭, 질문 힌트)
 */
import type { KbHit, Segment } from "./types.ts";
import type { LiveCardOut } from "./llm.ts";
import { clip } from "./util.ts";

const GLOSSARY: Record<string, string> = {
  hbm: "HBM(High Bandwidth Memory): D램을 수직으로 쌓아 대역폭을 키운 메모리. AI 가속기 성능의 병목이라 단가·마진이 일반 D램보다 높고, 적층 단수(8/12/16단)와 수율이 경쟁력의 핵심이에요.",
  "tc본더": "TC 본더(Thermo-Compression Bonder): HBM 적층 시 칩을 열·압력으로 붙이는 장비. 고객사 HBM 증설 속도가 곧 수주로 이어지고, 하이브리드 본딩 전환 시점이 중장기 리스크예요.",
  "tc bonder": "TC 본더(Thermo-Compression Bonder): HBM 적층 시 칩을 열·압력으로 붙이는 장비. 고객사 HBM 증설 속도가 곧 수주로 이어지고, 하이브리드 본딩 전환 시점이 중장기 리스크예요.",
  "hybrid bonding": "하이브리드 본딩: 범프 없이 구리-구리를 직접 접합하는 차세대 적층 기술. 16단 이상 HBM에서 도입 논의가 많고, 도입되면 기존 TC 본더 수요를 대체할 수 있어요.",
  "하이브리드 본딩": "하이브리드 본딩: 범프 없이 구리-구리를 직접 접합하는 차세대 적층 기술. 16단 이상 HBM에서 도입 논의가 많고, 도입되면 기존 TC 본더 수요를 대체할 수 있어요.",
  cowos: "CoWoS: TSMC의 2.5D 패키징. GPU와 HBM을 인터포저 위에 함께 올리는 방식으로, AI 칩 공급의 대표적 병목이에요.",
  tsv: "TSV(Through-Silicon Via): 칩을 관통하는 미세 구멍으로 위아래 칩을 연결하는 기술. HBM 적층의 기본 공정이에요.",
  yield: "수율(yield): 양품 비율. 신공정 초기에는 낮다가 올라가며, 수율 개선 속도가 원가와 공급량을 좌우해요.",
  "수율": "수율(yield): 양품 비율. 신공정 초기에는 낮다가 올라가며, 수율 개선 속도가 원가와 공급량을 좌우해요.",
  euv: "EUV: 극자외선 노광. 미세 공정의 핵심 장비로 대당 가격이 높아 CAPEX 부담이 커요.",
  capex: "CAPEX: 설비투자. 고객사 CAPEX 가이던스가 장비·소재 업체 수주의 선행지표예요.",
  "설비투자": "CAPEX(설비투자): 고객사 투자 계획이 장비·소재 업체 수주의 선행지표예요.",
  qualification: "퀄(Qualification): 고객사 품질 인증. 퀄 통과 전 매출은 확정이 아니므로 '퀄 진행 중'과 '양산 공급'을 구분해서 들어야 해요.",
  "퀄": "퀄(Qualification): 고객사 품질 인증. 퀄 통과 전 매출은 확정이 아니므로 '퀄 진행 중'과 '양산 공급'을 구분해서 들어야 해요.",
  asp: "ASP(평균판매단가): 믹스 개선인지 실제 가격 인상인지 구분해서 확인할 필요가 있어요.",
  "backlog": "Backlog(수주잔고): 향후 매출의 가시성. 잔고의 인도 시점과 취소 가능성을 함께 봐야 해요.",
  "수주잔고": "수주잔고(Backlog): 향후 매출의 가시성. 잔고의 인도 시점과 취소 가능성을 함께 봐야 해요.",
};

// 실제 수치(단위가 붙은 숫자)나 가이던스 언급만 잡는다. "3분기 실적부터…" 같은 시점 표현은 제외.
const NUMBER_RE = /\d[\d,.]*\s*(%|퍼센트|억|조|bn|billion|million|mn|대|단|nm|배|bp)|가이던스|guidance/i;

const QUESTION_HINTS: { re: RegExp; q: string }[] = [
  { re: /가이던스|guidance|전망|outlook/i, q: "그 가이던스의 전제(고객 수요·가격·환율)가 무엇이고, 하방 리스크 시나리오는 어떻게 보시나요?" },
  { re: /수주|order|backlog|잔고/i, q: "말씀하신 수주 중 확정 PO 비중과 인도 시점 분포를 알 수 있을까요?" },
  { re: /경쟁|competitor|점유율|share/i, q: "경쟁사 대비 우위가 기술 때문인지 고객 관계 때문인지, 1~2년 뒤에도 유지될 근거가 있나요?" },
  { re: /마진|margin|수익성/i, q: "마진 개선이 믹스 효과인지 원가 절감인지 나눠서 설명해주실 수 있나요?" },
  { re: /퀄|qualification|인증|샘플/i, q: "퀄 일정이 지연될 경우 매출 인식 시점은 어떻게 바뀌나요?" },
];

export function mockCards(fresh: Segment[], kbHits: KbHit[], seenTitles: Set<string>): LiveCardOut[] {
  const cards: LiveCardOut[] = [];
  const theirs = fresh.filter((s) => s.speaker !== "나" && s.speaker !== "메모");
  const text = theirs.map((s) => s.text).join(" ");
  const lower = text.toLowerCase();

  // 기술 용어
  for (const [term, explain] of Object.entries(GLOSSARY)) {
    if (!lower.includes(term)) continue;
    const title = `용어: ${explain.split(":")[0].split("(")[0]}`;
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    cards.push({ type: "tech", title, body: explain, quote: "", priority: 3, kb_doc_ids: [], web_query: "" });
    break; // 라운드당 1개
  }

  // 숫자 포착
  for (const s of theirs) {
    if (!NUMBER_RE.test(s.text)) continue;
    const title = `숫자: ${clip(s.text.replace(/\s+/g, " "), 22)}`;
    if (seenTitles.has(title)) continue;
    seenTitles.add(title);
    cards.push({
      type: "number",
      title,
      body: `상대가 말한 수치/시점: “${clip(s.text, 120)}” — 이전 발언·내 자료와 비교해보세요.`,
      quote: clip(s.text, 40),
      priority: 2,
      kb_doc_ids: [],
      web_query: "",
    });
    break;
  }

  // 내 자료 매칭
  const top = kbHits[0];
  if (top) {
    const title = `내 자료: ${clip(top.title, 20)}`;
    if (!seenTitles.has(title)) {
      seenTitles.add(title);
      cards.push({
        type: "kb",
        title,
        body: `관련 메모: “${clip(top.text.replace(/\s+/g, " "), 180)}”`,
        quote: "",
        priority: 2,
        kb_doc_ids: [top.docId],
        web_query: "",
      });
    }
  }

  // 질문 힌트
  for (const h of QUESTION_HINTS) {
    if (!h.re.test(text) || seenTitles.has(h.q)) continue;
    seenTitles.add(h.q);
    cards.push({ type: "question", title: h.q, body: "지금 이 흐름에서 던지기 좋은 후속 질문이에요.", quote: "", priority: 2, kb_doc_ids: [], web_query: "" });
    break;
  }

  return cards.slice(0, 4);
}
