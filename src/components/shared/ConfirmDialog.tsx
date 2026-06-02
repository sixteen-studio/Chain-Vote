"use client";

import { useCallback, useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmVariant = "default" | "danger" | "success";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const variantClasses: Record<ConfirmVariant, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  danger: "bg-error/10 text-error border-error/20",
  success: "bg-success/10 text-success border-success/20",
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        confirmLabel: "Lanjutkan",
        cancelLabel: "Batal",
        variant: "default",
        ...options,
        resolve,
      });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      state?.resolve(value);
      setState(null);
    },
    [state]
  );

  const dialog = (
    <Dialog open={!!state} onOpenChange={(open) => !open && close(false)}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md w-[95vw] bg-bg-card border-primary/20 p-0 overflow-hidden"
      >
        {state && (
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div
                className={cn(
                  "mb-4 flex size-11 items-center justify-center rounded-xl border",
                  variantClasses[state.variant ?? "default"]
                )}
              >
                <AlertTriangleIcon className="size-5" />
              </div>
              <DialogTitle className="font-display text-lg font-bold text-text-primary">
                {state.title}
              </DialogTitle>
              {state.description && (
                <DialogDescription className="text-sm leading-relaxed text-text-muted">
                  {state.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => close(false)}
                className="text-text-muted hover:text-text-primary"
              >
                {state.cancelLabel}
              </Button>
              <Button
                type="button"
                variant={state.variant === "danger" ? "destructive" : "default"}
                onClick={() => close(true)}
                className={cn(
                  state.variant === "success" &&
                    "bg-success/10 text-success border border-success/20 hover:bg-success/20",
                  state.variant === "danger" &&
                    "bg-error/10 text-error border border-error/20 hover:bg-error/20",
                  state.variant === "default" &&
                    "bg-linear-to-r from-primary to-secondary text-white"
                )}
              >
                {state.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog: dialog };
}
