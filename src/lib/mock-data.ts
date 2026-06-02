import {
  VotingSession,
  Candidate,
  User,
  DashboardStats,
  RecentActivity,
  ContractLog,
  VoteRecord,
} from "@/types";

// =====================
// Mock Voting Sessions
// =====================
export const mockVotingSessions: VotingSession[] = [];

// =====================
// Mock Candidates
// =====================
export const mockCandidates: Candidate[] = [];

// =====================
// Mock Users
// =====================
export const mockUsers: User[] = [];

// =====================
// Mock Dashboard Stats
// =====================
export const mockDashboardStats: DashboardStats = {
  totalVotingSessions: 0,
  activeVotingSessions: 0,
  upcomingVotingSessions: 0,
  endedVotingSessions: 0,
  totalVotes: 0,
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  suspendedUsers: 0,
};

// =====================
// Mock Recent Activity
// =====================
export const mockRecentActivity: RecentActivity[] = [];

// =====================
// Mock Contract Logs
// =====================
export const mockContractLogs: ContractLog[] = [];

// =====================
// Mock Vote Records
// =====================
export const mockVoteRecords: VoteRecord[] = [];
