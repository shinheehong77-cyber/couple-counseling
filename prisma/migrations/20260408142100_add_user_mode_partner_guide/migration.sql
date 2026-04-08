-- AlterTable
ALTER TABLE "Session" ADD COLUMN "insightJson" TEXT;

-- CreateTable
CREATE TABLE "PartnerGuide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "guideJson" TEXT NOT NULL,
    "guideText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerGuide_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartnerGuide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartnerGuide_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "response" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "coupleId" TEXT,
    "partnerCompletedAt" DATETIME,
    "partnerResponse" TEXT,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("completedAt", "createdAt", "description", "dueDate", "id", "response", "sessionId", "title", "type", "updatedAt", "userId") SELECT "completedAt", "createdAt", "description", "dueDate", "id", "response", "sessionId", "title", "type", "updatedAt", "userId" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE INDEX "Assignment_sessionId_idx" ON "Assignment"("sessionId");
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");
CREATE INDEX "Assignment_coupleId_idx" ON "Assignment"("coupleId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "coupleId" TEXT,
    "userMode" TEXT NOT NULL DEFAULT 'solo',
    "onboardedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("coupleId", "createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "coupleId", "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PartnerGuide_sessionId_key" ON "PartnerGuide"("sessionId");

-- CreateIndex
CREATE INDEX "PartnerGuide_coupleId_userId_idx" ON "PartnerGuide"("coupleId", "userId");

-- CreateIndex
CREATE INDEX "PartnerGuide_userId_idx" ON "PartnerGuide"("userId");
