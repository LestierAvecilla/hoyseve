"use client";

import { AlertTriangle } from "lucide-react";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 bg-popover bg-clip-padding border border-border rounded-xl shadow-xl w-[90%] max-w-sm p-6 space-y-5 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Icon */}
        {variant === "danger" && (
          <div className="flex justify-center">
            <div className="flex items-center justify-center size-12 rounded-full bg-rose-500/10">
              <AlertTriangle className="size-6 text-rose-400" />
            </div>
          </div>
        )}

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h2
            id="confirm-dialog-title"
            className="font-heading text-base font-medium text-foreground"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel ?? t.comments.cancel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel ?? t.comments.delete}
          </Button>
        </div>
      </div>
    </div>
  );
}