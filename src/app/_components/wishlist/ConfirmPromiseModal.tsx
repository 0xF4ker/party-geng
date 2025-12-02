"use client";

import React from "react";
import { Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { ContributionType } from "@prisma/client";

interface ConfirmPromiseModalProps {
  itemId: string;
  eventName: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConfirmPromiseModal = ({
  itemId,
  eventName,
  itemName,
  isOpen,
  onClose,
  onSuccess,
}: ConfirmPromiseModalProps) => {
  const { user } = useAuth();
  
  const contribute = api.wishlist.contributeToItem.useMutation({
      onSuccess: () => {
          toast.success("Promise made successfully!");
          onSuccess();
          onClose();
      },
      onError: (error) => {
          toast.error(error.message ?? "Failed to make promise.");
      }
  });

  const handleSubmit = () => {
    if (!user) {
      toast.error("Please log in to make a promise.");
      return;
    }

    contribute.mutate({
      itemId: itemId,
      guestName: user.username,
      type: ContributionType.PROMISE,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Promise</DialogTitle>
          <DialogDescription>
            You are about to promise to provide <strong>{itemName}</strong> for <strong>{eventName}</strong>. This will mark the item as fulfilled.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={contribute.isPending}
          >
            {contribute.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <><PartyPopper className="mr-2 h-4 w-4" />Confirm Promise</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
