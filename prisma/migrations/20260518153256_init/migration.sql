-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VOTER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VotingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('VOTE', 'USER_REGISTERED', 'SESSION_CREATED', 'SESSION_UPDATED', 'SESSION_CANCELLED', 'CONTRACT_DEPLOYED', 'USER_STATUS_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "nikHash" TEXT,
    "walletAddress" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VOTER',
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotingSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "VotingStatus" NOT NULL DEFAULT 'DRAFT',
    "contractAddress" TEXT,
    "txHash" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VotingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "slogan" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "programs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "candidateIndex" INTEGER NOT NULL,
    "votingSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "votingSessionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractLog" (
    "id" TEXT NOT NULL,
    "votingSessionId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nikHash_key" ON "User"("nikHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "VotingSession_contractAddress_key" ON "VotingSession"("contractAddress");

-- CreateIndex
CREATE INDEX "VotingSession_status_idx" ON "VotingSession"("status");

-- CreateIndex
CREATE INDEX "VotingSession_startTime_endTime_idx" ON "VotingSession"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "Candidate_votingSessionId_idx" ON "Candidate"("votingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_votingSessionId_candidateIndex_key" ON "Candidate"("votingSessionId", "candidateIndex");

-- CreateIndex
CREATE UNIQUE INDEX "VoteRecord_txHash_key" ON "VoteRecord"("txHash");

-- CreateIndex
CREATE INDEX "VoteRecord_votingSessionId_idx" ON "VoteRecord"("votingSessionId");

-- CreateIndex
CREATE INDEX "VoteRecord_candidateId_idx" ON "VoteRecord"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteRecord_userId_votingSessionId_key" ON "VoteRecord"("userId", "votingSessionId");

-- CreateIndex
CREATE INDEX "ContractLog_votingSessionId_idx" ON "ContractLog"("votingSessionId");

-- CreateIndex
CREATE INDEX "ContractLog_status_idx" ON "ContractLog"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_type_idx" ON "ActivityLog"("type");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "VotingSession" ADD CONSTRAINT "VotingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "VotingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "VotingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLog" ADD CONSTRAINT "ContractLog_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "VotingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
