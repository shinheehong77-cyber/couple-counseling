# Architecture — 마주 (Maju)

> Last updated: 2026-04-08 (Phase A skeleton)

## DB Models

### User
id, name, email (unique), passwordHash, coupleId?, **userMode** ("solo"|"couple"), **onboardedAt?**, createdAt, updatedAt
Relations: couple, authSessions[], sessions[], counselorProfile?, surveySessions[], assignments[], funnelEvents[], programs[], assessmentReports[], **partnerGuides[]**

### AuthSession
id, userId, token (unique), expiresAt, createdAt
Server-side session; token stored in httpOnly cookie.

### Couple
id, inviteCode (unique, 6-char), createdAt
Relations: members (User[]), sessions[], surveySessions[], **partnerGuides[]**

### Session (Counseling Session)
id, userId, coupleId?, counselingMode (chat|voice), startedFromSurveyId?, counselorName, status (active|completed|crisis), conflictType?, onboardingDone, crisisLevel (CRITICAL|WARNING|WATCH)?, watchCount, surveyContextJson?, **insightJson?**, createdAt, updatedAt
Relations: user, couple?, startedFromSurvey?, messages[], emotionStates[], assignments[], funnelEvents[], **partnerGuide?**

### Message
id, sessionId, role (user|assistant|system), content, metadata? (JSON), senderUserId?, createdAt

### EmotionState
id, sessionId, emotion (anger|sadness|fear|shame|loneliness), intensity (0.0-1.0), source?, context?, createdAt

### SurveySession
id, userId, coupleId?, version (brief|comprehensive), sectionProgressJson?, resumeQuestionId?, lastAnsweredQuestionId?, lastActivityAt?, completedAt?, createdAt, updatedAt
Relations: user, couple?, counselingSessions[], answers[], funnelEvents[]

### SurveyAnswer
id, surveySessionId, questionId, answer (JSON), createdAt

### FunnelEvent
id, eventName, stage?, userId?, surveySessionId?, sessionId?, payloadJson?, createdAt

### Assignment
id, sessionId, userId, title, description?, type?, response?, **isShared** (default false), **coupleId?**, **partnerCompletedAt?**, **partnerResponse?**, dueDate?, completedAt?, createdAt, updatedAt

### CounselorProfile
id, userId (unique), displayName, avatarUrl?, specialty?

### Program
id, userId, coupleId?, status (active|completed|paused), startedAt, completedAt?, currentWeek (1-4), createdAt, updatedAt
Relations: user, weeks[]

### ProgramWeek
id, programId, weekNumber (1-4), theme, status (locked|active|completed), progress (0-1.0), unlockedAt?, completedAt?, checkInSurveyId?, createdAt, updatedAt
Relations: program, milestones[]

### ProgramMilestone
id, weekId, type (counseling_session|assignment|check_in_survey), title, description?, ordinal, referenceId?, completedAt?, createdAt
Relations: week

### AssessmentReport
id, userId, programId?, initialSurveyId, finalSurveyId, reportJson, aiInsights?, shareToken?, createdAt
Relations: user

### PartnerGuide (NEW)
id, sessionId (unique), userId, coupleId, version, guideJson, guideText, createdAt
Relations: session, user ("GuideAboutUser"), couple
- Generated from Session.insightJson after counseling session ends
- userId = the person the guide is ABOUT (their traits/needs)
- Partner reads the guide to understand their spouse

---

## API Route Map

### Auth & User

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/signup | Register new user (name, email, password) |
| POST | /api/auth/login | Email + password login, sets session cookie |
| POST | /api/auth/logout | Clear session cookie + delete AuthSession |
| GET | /api/auth/session | Get current user info (includes userMode, onboardedAt) |

### Onboarding (NEW)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/onboarding | Set userMode + mark onboarding complete |

### Counseling

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/sessions | Create new counseling session |
| GET | /api/sessions | List sessions for current user |
| PATCH | /api/sessions | End session (complete) + auto-generate assignments + extract insightJson |
| POST | /api/chat | Send message to AI counselor, returns streamed response |
| GET | /api/chat | Load messages for existing session |

### Survey

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/survey | Create new survey session |
| GET | /api/survey | Get active/latest survey session |
| GET | /api/survey/[surveyId] | Get survey session by ID with progress |
| POST | /api/survey/[surveyId] | Submit answer for a survey question |

### Assignments

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/assignments | Create assignment (supports isShared, coupleId) |
| GET | /api/assignments | List assignments for current user (includes shared via coupleId) |
| GET | /api/assignments/[assignmentId] | Get single assignment detail |
| PATCH | /api/assignments/[assignmentId] | Update assignment (complete, add response) |
| POST | /api/assignments/seed | Seed assignment templates |

### Couples

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/couples/invite | Create couple + generate invite code |
| POST | /api/couples/join | Join couple via invite code |
| GET | /api/couples/status | Get couple info + partner status |
| GET | /api/couples/sessions | List couple's shared sessions |
| POST | /api/couples/sessions | Create couple counseling session |

### Partner Guide (NEW)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/partner-guide | Get latest partner guide about my partner |
| GET | /api/partner-guide/history | List all partner guide versions |
| POST | /api/partner-guide/generate | Generate guide from session insight (internal) |

### Program

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/program | Create new 4-week program |
| GET | /api/program | Get current active program |
| GET | /api/program/[programId]/week/[weekNumber] | Get week detail with milestones |
| PATCH | /api/program/[programId]/week/[weekNumber] | Update week status/progress |
| PATCH | /api/program/[programId]/milestone/[milestoneId] | Mark milestone complete |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/report/generate | Generate before/after assessment report |
| GET | /api/report/[reportId] | Get assessment report |
| GET | /api/report/share/[shareToken] | Public shareable report view |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/analytics/overview | Dashboard overview |
| GET | /api/analytics/emotions | Emotion data over time |
| GET | /api/analytics/survey-scores | Survey domain scores over time |
| GET | /api/analytics/funnel | Funnel conversion metrics |

### Misc

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | DB connectivity check |

---

## Page Structure

| Path | Description | Status |
|------|-------------|--------|
| / | Landing / login page | Implemented |
| /about | About page | Implemented |
| /auth/login | Login form | Implemented |
| /auth/signup | Registration form | Implemented |
| /onboarding | **User mode selection (solo/couple)** | **Skeleton** |
| /dashboard | Main dashboard (userMode-aware) | Implemented |
| /chat | AI counseling chat interface | Implemented |
| /survey | Survey flow | Implemented |
| /assignments | Assignment list + detail view | Implemented |
| /program | 4-week program overview | Implemented |
| /program/week/[weekNumber] | Week detail | Implemented |
| /couple | Couple management (invite, status, shared sessions) | Implemented |
| /partner-guide | **Partner understanding guide view** | **Skeleton** |
| /sessions | Session history list | Implemented |
| /report/[reportId] | Assessment report viewer | Implemented |
| /counseling | Counseling session management | Implemented |
| /admin/review | Admin review page | Implemented |

---

## Shared Types

### `src/types/` (NEW — cross-layer contracts)

| File | Key Types |
|------|-----------|
| `user.ts` | UserMode, AuthUserResponse, OnboardingRequest, OnboardingResponse |
| `session.ts` | SessionInsight, SuggestionMeta, SessionCompleteMeta, StageMeta, AssignmentMeta, EmotionMeta |
| `partner-guide.ts` | PartnerGuideData, PartnerGuideResponse, GeneratePartnerGuideRequest |
| `assignment.ts` | AssignmentResponse, SharedAssignmentView |
| `index.ts` | Barrel export of all types |

### `src/lib/survey/types/index.ts` (existing)

- **SurveyResult** — total score, domain scores, risk flags, AI context payload
- **AIContextPayload** — injected into counseling prompts
- **DomainScore** — per-domain score (0-100) with level
- **SurveyQuestion** — union of Likert, VisualSlider, Checklist, FreeText, YesNo
- **CounselingApproach** — eft_attachment, gottman_conflict, etc.

### Other shared types (in lib/)

- **CrisisLevel** (`src/lib/crisis-detection.ts`) — "CRITICAL" | "WARNING" | "WATCH" | null
- **FunnelEventName** (`src/lib/analytics/funnel-events.ts`) — typed event names

---

## Dependencies

### Current
- **Framework**: Next.js 16.2 + React 19.2 + TypeScript 5
- **Styling**: Tailwind CSS v4 + tw-animate-css
- **UI**: shadcn v4 (Radix UI) + Lucide React icons
- **DB**: Prisma 7.6 + SQLite via @libsql/client + @prisma/adapter-libsql
- **AI**: @anthropic-ai/sdk 0.81
- **Auth**: bcryptjs
- **Monitoring**: @sentry/nextjs 10.47
- **Utilities**: clsx, tailwind-merge, class-variance-authority

### [PLANNED] Additions
- **recharts** — chart library for analytics dashboard
