/**
 * 설문 모듈 공개 API
 */

// 타입
export * from './types';

// 데이터
export { briefSurvey, BRIEF_SURVEY_META } from './data/brief';
export { comprehensiveSurvey, COMPREHENSIVE_SURVEY_META } from './data/comprehensive';

// 점수 계산
export {
  calcDomainScores,
  calcSurveyResult,
  buildAIPromptContext,
  scoreToLevel,
  DOMAIN_WEIGHTS,
  SCORE_INTERPRETATION,
} from './scoring';

// 컴포넌트
export { default as SurveyPage } from './components/SurveyPage';

// 훅
export { useSurveySession } from './hooks/useSurveySession';
