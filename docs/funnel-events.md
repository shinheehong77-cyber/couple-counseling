# Funnel Event Schema

This document defines the backend event schema for counseling mode selection and survey progression.

## Storage

Events are stored in `FunnelEvent` with this shape:

- `eventName`: event key
- `stage`: funnel stage (`survey`, `relationship`, `personality`, `session`)
- `userId`: optional user link
- `surveySessionId`: optional survey session link
- `sessionId`: optional counseling session link
- `payloadJson`: JSON-serialized event payload
- `createdAt`: event timestamp

## Event Definitions

### `mode_selected`

- Trigger: `POST /api/sessions`
- Purpose: Persist user mode choice and connect it to created counseling session
- Payload:
  - `mode`: `chat | voice`
  - `sessionId`: created counseling session id
  - `linkedSurveySessionId`: survey session id used to start counseling (if present)

### `survey_started`

- Trigger: `POST /api/survey`
- Purpose: Track survey entry by version
- Payload:
  - `version`: `brief | comprehensive`
  - `totalQuestions`
  - `sections`: list of `{ key, totalQuestions }`

### `section_completed`

- Trigger: `POST /api/survey/:surveyId` when a section transitions to completed
- Stage values:
  - `relationship`
  - `personality`
- Payload:
  - `sectionKey`
  - `sectionLabel`
  - `answeredQuestions`
  - `totalQuestions`
  - `version`

### `survey_resumed`

- Trigger: `POST /api/survey/:surveyId` with `resumed: true`
- Payload:
  - `currentQuestionId`
  - `resumeQuestionId`
  - `progressPercent`
  - `version`

### `survey_dropped`

- Trigger: `POST /api/survey/:surveyId` with `dropped: true`
- Payload:
  - `currentQuestionId`
  - `progressPercent`
  - `version`

## API Response Additions

Survey APIs now include explicit progress metadata for FE consumption:

- `progress.version`
- `progress.totalQuestions`
- `progress.answeredQuestions`
- `progress.progressPercent`
- `progress.currentQuestionIndex`
- `progress.currentQuestionId`
- `progress.resumeQuestionId`
- `progress.sections[]` with `key`, `label`, `totalQuestions`, `answeredQuestions`, `completed`, `domains`
