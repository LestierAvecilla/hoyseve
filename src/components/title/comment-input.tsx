"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  placeholder: string;
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function CommentInput({
  placeholder,
  onSubmit,
  onCancel,
  submitLabel,
  autoFocus = false,
}: CommentInputProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[60px] placeholder:text-muted-foreground/60"
        rows={3}
        maxLength={1000}
        disabled={submitting}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !body.trim()}
          className={cn(
            "px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground transition-colors",
            "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {submitting ? t.comments.submitting : submitLabel ?? t.comments.submit}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.comments.cancel}
          </button>
        )}
      </div>
    </div>
  );
}
