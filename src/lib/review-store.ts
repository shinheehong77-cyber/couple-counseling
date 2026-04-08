export interface Annotation {
  id: string;
  pageKey: string;
  xPercent: number;
  yPercent: number;
  type: 'text' | 'design' | 'layout' | 'general';
  note: string;
  status: 'pending' | 'applied';
  createdAt: string;
}

export interface ReviewPage {
  key: string;
  label: string;
  path: string;
  description: string;
}

export const REVIEW_PAGES: ReviewPage[] = [
  { key: 'landing',     label: '랜딩',    path: '/',              description: '메인 랜딩 페이지' },
  { key: 'login',       label: '로그인',  path: '/auth/login',    description: '로그인 폼' },
  { key: 'signup',      label: '회원가입', path: '/auth/signup',  description: '회원가입 폼' },
  { key: 'dashboard',   label: '대시보드', path: '/dashboard',    description: '메인 대시보드' },
  { key: 'chat',        label: '상담',    path: '/chat',          description: '상담 채팅' },
  { key: 'counseling',  label: '상담 시작', path: '/counseling',  description: '상담 모드 선택' },
  { key: 'survey',      label: '설문',    path: '/survey',        description: '관계 설문' },
  { key: 'assignments', label: '과제',    path: '/assignments',   description: '과제 목록' },
  { key: 'program',     label: '프로그램', path: '/program',      description: '4주 프로그램' },
  { key: 'couple',      label: '커플',    path: '/couple',        description: '커플 관리' },
  { key: 'about',       label: '소개',    path: '/about',         description: '서비스 소개' },
];

export const ANNOTATION_TYPE_LABELS: Record<Annotation['type'], string> = {
  text:    '텍스트 변경',
  design:  '디자인 수정',
  layout:  '레이아웃 변경',
  general: '일반 메모',
};

export const ANNOTATION_TYPE_COLORS: Record<Annotation['type'], string> = {
  text:    '#D4A574',
  design:  '#A5D4BC',
  layout:  '#B8A5D4',
  general: '#D4B8A5',
};

// Flow connections: defines the default user journey
export interface FlowConnection {
  from: string; // pageKey
  to: string;   // pageKey
  label?: string;
}

export const DEFAULT_FLOW_CONNECTIONS: FlowConnection[] = [
  { from: 'landing', to: 'login', label: '로그인' },
  { from: 'landing', to: 'signup', label: '회원가입' },
  { from: 'signup', to: 'dashboard' },
  { from: 'login', to: 'dashboard' },
  { from: 'dashboard', to: 'counseling', label: '상담 시작' },
  { from: 'dashboard', to: 'survey', label: '설문하기' },
  { from: 'dashboard', to: 'assignments', label: '과제' },
  { from: 'dashboard', to: 'program', label: '프로그램' },
  { from: 'dashboard', to: 'couple', label: '커플 관리' },
  { from: 'counseling', to: 'chat' },
  { from: 'survey', to: 'chat', label: '설문 후 상담' },
];

const STORAGE_KEY = 'couple-review-annotations';
const ORDER_STORAGE_KEY = 'couple-review-page-order';
const FLOW_STORAGE_KEY = 'couple-review-flow-connections';

export function loadPageOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

export function savePageOrder(order: string[]): void {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function loadFlowConnections(): FlowConnection[] {
  try {
    const raw = localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return DEFAULT_FLOW_CONNECTIONS;
    return JSON.parse(raw) as FlowConnection[];
  } catch {
    return DEFAULT_FLOW_CONNECTIONS;
  }
}

export function saveFlowConnections(connections: FlowConnection[]): void {
  localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(connections));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadAnnotations(): Annotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Annotation[];
  } catch {
    return [];
  }
}

export function saveAnnotations(annotations: Annotation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
}

export function getPageAnnotations(annotations: Annotation[], pageKey: string): Annotation[] {
  return annotations.filter((a) => a.pageKey === pageKey);
}

export function exportAsMarkdown(annotations: Annotation[]): string {
  const now = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = annotations.length;

  const byType = (['text', 'design', 'layout', 'general'] as Annotation['type'][]).map((type) => {
    const count = annotations.filter((a) => a.type === type).length;
    return count > 0 ? `${ANNOTATION_TYPE_LABELS[type]} ${count}건` : null;
  }).filter(Boolean).join(', ');

  const pendingCount  = annotations.filter((a) => a.status === 'pending').length;
  const appliedCount  = annotations.filter((a) => a.status === 'applied').length;

  const lines: string[] = [
    '# 화면 리뷰 결과',
    '',
    `날짜: ${now}`,
    '',
    '## 요약',
    '',
    `- 전체 메모: ${total}건`,
    `- 유형별: ${byType || '없음'}`,
    `- 상태별: 대기 중 ${pendingCount}건, 적용 완료 ${appliedCount}건`,
    '',
  ];

  for (const page of REVIEW_PAGES) {
    const pageAnnotations = getPageAnnotations(annotations, page.key);
    if (pageAnnotations.length === 0) continue;

    lines.push(`## ${page.label} (${page.path})`);
    lines.push('');
    lines.push('| # | 위치 | 유형 | 메모 | 상태 |');
    lines.push('|---|------|------|------|------|');

    pageAnnotations.forEach((annotation, index) => {
      const position   = `(${Math.round(annotation.xPercent)}%, ${Math.round(annotation.yPercent)}%)`;
      const typeLabel  = ANNOTATION_TYPE_LABELS[annotation.type];
      const statusIcon = annotation.status === 'applied' ? '✅' : '⏳';
      const note       = annotation.note.replace(/\|/g, '\\|');
      lines.push(`| ${index + 1} | ${position} | ${typeLabel} | ${note} | ${statusIcon} |`);
    });

    lines.push('');
  }

  return lines.join('\n');
}
