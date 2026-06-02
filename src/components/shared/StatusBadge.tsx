import { cn } from "@/lib/utils";
import { VotingStatus, AccountStatus } from "@/types";
import { getVotingStatusLabel, getAccountStatusLabel } from "@/lib/utils";
import { PencilIcon, ZapIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, UserCheckIcon, UserXIcon } from "lucide-react";

interface VoteStatusBadgeProps {
  status: VotingStatus;
  className?: string;
}

export function VoteStatusBadge({ status, className }: VoteStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        {
          "badge-active": status === "ACTIVE",
          "badge-draft": status === "DRAFT",
          "badge-ended": status === "ENDED",
          "badge-cancelled": status === "CANCELLED",
        },
        className
      )}
    >
      {status === "DRAFT" && <PencilIcon className="w-3.5 h-3.5 text-text-muted" />}
      {status === "ACTIVE" && <ZapIcon className="w-3.5 h-3.5 text-success animate-pulse" />}
      {status === "ENDED" && <CheckCircle2Icon className="w-3.5 h-3.5 text-primary" />}
      {status === "CANCELLED" && <XCircleIcon className="w-3.5 h-3.5 text-error" />}
      {getVotingStatusLabel(status)}
    </span>
  );
}

interface AccountStatusBadgeProps {
  status: AccountStatus;
  className?: string;
}

export function AccountStatusBadge({ status, className }: AccountStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        {
          "badge-active": status === "ACTIVE",
          "badge-draft": status === "PENDING",
          "badge-cancelled": status === "SUSPENDED",
        },
        className
      )}
    >
      {status === "PENDING" && <ClockIcon className="w-3.5 h-3.5 text-text-muted" />}
      {status === "ACTIVE" && <UserCheckIcon className="w-3.5 h-3.5 text-success" />}
      {status === "SUSPENDED" && <UserXIcon className="w-3.5 h-3.5 text-error" />}
      {getAccountStatusLabel(status)}
    </span>
  );
}
