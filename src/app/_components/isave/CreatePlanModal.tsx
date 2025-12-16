"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SavePlanFrequency } from "@prisma/client";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [frequency, setFrequency] = useState<SavePlanFrequency>("MANUAL");
  const [autoSaveAmount, setAutoSaveAmount] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");

  const createMutation = api.savePlan.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create plan");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (frequency !== "MANUAL" && !autoSaveAmount) {
        toast.error("Please enter an amount to save automatically.");
        return;
    }

    createMutation.mutate({
      title,
      description,
      targetAmount: Number(targetAmount),
      targetDate: new Date(targetDate),
      frequency,
      autoSaveAmount: autoSaveAmount ? Number(autoSaveAmount) : undefined,
      initialDeposit: initialDeposit ? Number(initialDeposit) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Savings Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Plan Title</Label>
            <Input
              id="title"
              placeholder="e.g. Wedding Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target Amount (₦)</Label>
                <Input
                id="targetAmount"
                type="number"
                placeholder="500000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                min="1000"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frequency">Savings Frequency</Label>
            <Select value={frequency} onValueChange={(val) => setFrequency(val as SavePlanFrequency)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual Deposits Only</SelectItem>
                <SelectItem value="DAILY">Daily Auto-Save</SelectItem>
                <SelectItem value="WEEKLY">Weekly Auto-Save</SelectItem>
                <SelectItem value="MONTHLY">Monthly Auto-Save</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency !== "MANUAL" && (
             <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="autoSaveAmount">Amount to Save {frequency.toLowerCase()} (₦)</Label>
                <Input
                id="autoSaveAmount"
                type="number"
                placeholder="5000"
                value={autoSaveAmount}
                onChange={(e) => setAutoSaveAmount(e.target.value)}
                required
                />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="initialDeposit">Initial Deposit (Optional)</Label>
            <Input
              id="initialDeposit"
              type="number"
              placeholder="Start with some funds?"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What are you saving for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
