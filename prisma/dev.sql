PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" TEXT NOT NULL DEFAULT 'STUDENT',
  "avatar" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "streak" INTEGER NOT NULL DEFAULT 0,
  "lastActive" DATETIME,
  "lastLoginDate" DATETIME
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE IF NOT EXISTS "Classroom" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "inviteCode" TEXT NOT NULL UNIQUE,
  "teacherId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ClassroomMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassroomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClassroomMember_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ClassroomMember_userId_classroomId_key" ON "ClassroomMember"("userId", "classroomId");

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "fileName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Unit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "storyMode" TEXT NOT NULL,
  "calmMode" TEXT NOT NULL,
  "gameMode" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "unitId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "options" TEXT NOT NULL,
  "correct" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  CONSTRAINT "QuizQuestion_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BrainProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "dominant" TEXT NOT NULL,
  "scores" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "BrainProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "StudentProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "quizScore" INTEGER,
  "quizAnswers" TEXT,
  "learningMode" TEXT,
  "timeSpent" INTEGER NOT NULL DEFAULT 0,
  "completedAt" DATETIME,
  CONSTRAINT "StudentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudentProgress_userId_unitId_key" ON "StudentProgress"("userId", "unitId");

CREATE TABLE IF NOT EXISTS "IEPNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL DEFAULT 'standard',
  "is504" BOOLEAN NOT NULL DEFAULT false,
  "extraSupport" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "IEPNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "IEPNote_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "IEPNote_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "IEPNote_studentId_classroomId_key" ON "IEPNote"("studentId", "classroomId");

CREATE TABLE IF NOT EXISTS "Badge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "category" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserBadge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

CREATE TABLE IF NOT EXISTS "XPHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XPHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classroomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isAnnouncement" BOOLEAN NOT NULL DEFAULT false,
  "isAI" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BrainQuizCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ageGroup" TEXT NOT NULL UNIQUE,
  "questions" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

PRAGMA foreign_keys=ON;
