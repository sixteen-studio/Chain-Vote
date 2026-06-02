import { getEffectiveVotingStatus } from "@/lib/server/voting-status";

type CandidateRecord = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  slogan: string | null;
  vision: string | null;
  mission: string | null;
  programs: string[];
  candidateIndex: number;
  votingSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { voteRecords: number };
};

type SessionRecord = {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";
  contractAddress: string | null;
  txHash: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { voteRecords: number; candidates: number };
};

type CandidateWithSessionRecord = CandidateRecord & {
  votingSession?: SessionRecord | null;
};

export function serializeSession(session: SessionRecord) {
  return {
    id: session.id,
    title: session.title,
    description: session.description,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    status: getEffectiveVotingStatus(session),
    contractAddress: session.contractAddress ?? undefined,
    txHash: session.txHash ?? undefined,
    createdById: session.createdById,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    candidates: [],
    _count: session._count,
  };
}

export function serializeCandidate(candidate: CandidateWithSessionRecord) {
  return {
    id: candidate.id,
    name: candidate.name,
    description: candidate.description ?? undefined,
    imageUrl: candidate.imageUrl ?? undefined,
    slogan: candidate.slogan ?? undefined,
    vision: candidate.vision ?? undefined,
    mission: candidate.mission ?? undefined,
    programs: candidate.programs,
    candidateIndex: candidate.candidateIndex,
    votingSessionId: candidate.votingSessionId,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    voteCount: candidate._count?.voteRecords ?? 0,
    votingSession: candidate.votingSession ? serializeSession(candidate.votingSession) : undefined,
  };
}
