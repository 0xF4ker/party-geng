"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ReportReason =
  | "EXPLICIT_CONTENT"
  | "ILLEGAL_ACTIVITY"
  | "HARASSMENT"
  | "HATE_SPEECH_OR_VIOLENCE"
  | "SPAM"
  | "OTHER";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetPostId?: string;
}

export const ReportModal = ({
  isOpen,
  onClose,
  targetUserId,
  targetPostId,
}: ReportModalProps) => {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");

  const reportMutation = api.report.create.useMutation({
    onSuccess: () => {
      toast.success(
        "Report submitted. Thank you for keeping our community safe.",
      );
      onClose();
      setDetails("");
      setReason("SPAM");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit report.");
    },
  });

  const handleSubmit = () => {
    reportMutation.mutate({
      reason,
      details,
      targetUserId,
      targetPostId,
    });
  };

  const REASONS: { value: ReportReason; label: string }[] = [
    { value: "EXPLICIT_CONTENT", label: "Explicit sexual content" },
    { value: "ILLEGAL_ACTIVITY", label: "Promotion of illegal activities" },
    { value: "HARASSMENT", label: "Cyberbullying or harassment" },
    { value: "HATE_SPEECH_OR_VIOLENCE", label: "Hate speech or violence" },
    { value: "SPAM", label: "Spam or scam" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong. This report will be reviewed by our
            safety team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Why are you reporting this?</Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as ReportReason)}
              className="gap-2"
            >
              {REASONS.map((r) => (
                <div
                  key={r.value}
                  className="flex items-center space-x-2 rounded-md border border-gray-100 p-2 hover:bg-gray-50"
                >
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label
                    htmlFor={r.value}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              placeholder="Please provide any specific details..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={reportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
