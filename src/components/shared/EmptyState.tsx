import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { SearchXIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-bg-card border border-primary/20 flex items-center justify-center mb-4 text-text-muted">
        {icon ?? <SearchXIcon className="w-7 h-7" />}
      </div>
      <h3 className="font-display font-semibold text-text-primary text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <ButtonLink
              href={action.href}
              size="sm"
              className="bg-primary hover:bg-primary-dark text-white border-0"
            >
              {action.label}
            </ButtonLink>
          ) : (
            <Button size="sm" onClick={action.onClick} className="bg-primary hover:bg-primary-dark text-white border-0">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
