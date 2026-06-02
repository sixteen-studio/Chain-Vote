import type { VotingStatus } from "@/types";

type SessionStatusInput = {
  status: VotingStatus;
  startTime: Date | string;
  endTime: Date | string;
  contractAddress?: string | null;
};

export function getEffectiveVotingStatus(session: SessionStatusInput): VotingStatus {
  if (session.status === "CANCELLED") return "CANCELLED";
  if (session.status === "ENDED") return "ENDED";
  if (session.status === "DRAFT" || !session.contractAddress) return "DRAFT";

  const now = Date.now();
  const startTime = new Date(session.startTime).getTime();
  const endTime = new Date(session.endTime).getTime();

  if (now < startTime) return "DRAFT";
  if (now > endTime) return "ENDED";
  return "ACTIVE";
}
