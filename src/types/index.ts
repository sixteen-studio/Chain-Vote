// =====================
// Enums
// =====================
export type VotingStatus = "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED";
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type Role = "VOTER" | "ADMIN" | "SUPER_ADMIN";

// =====================
// User
// =====================
export interface User {
  id: string;
  fullName: string;
  email: string;
  walletAddress: string;
  role: Role;
  accountStatus: AccountStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string;
}

// =====================
// Candidate
// =====================
export interface Candidate {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  candidateIndex: number;
  votingSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  votingSession?: VotingSession;
  voteCount?: number;
  slogan?: string;
  vision?: string;
  mission?: string;
  programs?: string[];
}

// =====================
// Voting Session
// =====================
export interface VotingSession {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: VotingStatus;
  contractAddress?: string;
  txHash?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  candidates: Candidate[];
  _count?: {
    voteRecords: number;
    candidates: number;
  };
  votersCount?: number;
}

// =====================
// Vote Record
// =====================
export interface VoteRecord {
  id: string;
  userId: string;
  votingSessionId: string;
  candidateId: string;
  walletAddress: string;
  txHash: string;
  blockNumber: number;
  votedAt: string;
  user?: User;
  candidate?: Candidate;
  votingSession?: VotingSession;
}

// =====================
// Blockchain
// =====================
export interface BlockchainResult {
  candidateIndex: number;
  name: string;
  voteCount: number;
  percentage: number;
}

export interface ContractLog {
  id: string;
  votingSessionId: string;
  votingSession: VotingSession;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  deployedAt: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

// =====================
// Admin Stats
// =====================
export interface DashboardStats {
  totalVotingSessions: number;
  activeVotingSessions: number;
  upcomingVotingSessions: number;
  endedVotingSessions: number;
  totalVotes: number;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
}

export interface RecentActivity {
  id: string;
  type:
    | "VOTE"
    | "USER_REGISTERED"
    | "SESSION_CREATED"
    | "CONTRACT_DEPLOYED"
    | "SESSION_UPDATED"
    | "SESSION_CANCELLED"
    | "USER_STATUS_UPDATED"
    | "DATA_UPDATED"
    | "DATA_DELETED"
    | "BLOCKCHAIN_UPDATED"
    | "BLOCKCHAIN_DELETED";
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// =====================
// API Response
// =====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

// =====================
// MetaMask / Wallet
// =====================
export interface WalletState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

// =====================
// Form Types
// =====================
export interface RegisterFormData {
  fullName: string;
  nik: string;
  email: string;
  walletAddress: string;
}

export interface VotingFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  candidates: CandidateFormData[];
}

export interface CandidateFormData {
  name: string;
  description?: string;
  imageUrl?: string;
}

// =====================
// Navigation
// =====================
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
