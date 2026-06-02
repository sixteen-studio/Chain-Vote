-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_votingSessionId_fkey";

-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "votingSessionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_votingSessionId_fkey" FOREIGN KEY ("votingSessionId") REFERENCES "VotingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
