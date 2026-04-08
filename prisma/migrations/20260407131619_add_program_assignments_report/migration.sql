-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "response" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "type" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN "senderUserId" TEXT;

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'locked',
    "progress" REAL NOT NULL DEFAULT 0,
    "unlockedAt" DATETIME,
    "completedAt" DATETIME,
    "checkInSurveyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramWeek_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ordinal" INTEGER NOT NULL,
    "referenceId" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgramMilestone_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "programId" TEXT,
    "initialSurveyId" TEXT NOT NULL,
    "finalSurveyId" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "aiInsights" TEXT,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Program_userId_idx" ON "Program"("userId");

-- CreateIndex
CREATE INDEX "ProgramWeek_programId_idx" ON "ProgramWeek"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWeek_programId_weekNumber_key" ON "ProgramWeek"("programId", "weekNumber");

-- CreateIndex
CREATE INDEX "ProgramMilestone_weekId_idx" ON "ProgramMilestone"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentReport_shareToken_key" ON "AssessmentReport"("shareToken");

-- CreateIndex
CREATE INDEX "AssessmentReport_userId_idx" ON "AssessmentReport"("userId");

-- CreateIndex
CREATE INDEX "AssessmentReport_shareToken_idx" ON "AssessmentReport"("shareToken");
