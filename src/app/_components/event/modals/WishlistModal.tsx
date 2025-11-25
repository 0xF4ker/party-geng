"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, X, Check, Copy } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];
type wishlistItem = NonNullable<event["wishlist"]>["items"][number];

interface WishlistModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistModal = ({ event, isOpen, onClose }: WishlistModalProps) => {
  const [copied, setCopied] = useState(false);
  const utils = api.useUtils();

  const addItem = api.wishlist.addItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });
  const updateItem = api.wishlist.updateItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });
  const deleteItem = api.wishlist.deleteItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
  });

  const items = event.wishlist?.items ?? [];

  const copyLink = async () => {
    const textToCopy = `${window.location.origin}/wishlist/${event.id}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleToggleFulfilled = (item: wishlistItem) => {
    updateItem.mutate({ itemId: item.id, isFulfilled: !item.isFulfilled });
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newItemName = (form.elements.namedItem("newItem") as HTMLInputElement)
      ?.value;
    const newItemPrice = (
      form.elements.namedItem("newItemPrice") as HTMLInputElement
    )?.value;
    if (!newItemName || !newItemPrice) return;

    addItem.mutate({
      eventId: event.id,
      name: newItemName,
      price: Number(newItemPrice),
    });
    form.reset();
  };

  const handleRemoveItem = (itemId: string) => {
    deleteItem.mutate({ itemId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Event Wishlist</DialogTitle>
        </DialogHeader>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h3 className="text-xl font-semibold">Event Wishlist</h3>
            <p className="text-sm text-gray-500">{event.title}</p>
          </div>
        </div>

        <div className="shrink-0 border-b border-gray-200 p-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Share Your Wishlist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/wishlist/${event.id}`}
              className="w-full rounded-md border border-gray-300 bg-gray-50 p-2 text-sm"
            />
            <Button onClick={copyLink} disabled={copied}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          <h4 className="mb-3 font-semibold text-gray-800">Wishlist Items</h4>
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-4 py-3">
                <input
                  type="checkbox"
                  checked={item.isFulfilled}
                  onChange={() => handleToggleFulfilled(item)}
                  disabled={updateItem.isPending}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <div className="grow">
                  <p className={cn("font-medium text-gray-800", item.isFulfilled && "text-gray-500 line-through")}>
                    {item.name}
                  </p>
                  <p className={cn("text-sm", item.isFulfilled ? "text-gray-400" : "text-gray-500")}>
                    Est. Price: ₦{item.price?.toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.isFulfilled ? (
                    <span className="flex items-center gap-1.5 font-semibold text-green-600">
                      <Check className="h-5 w-5" />
                      Fulfilled!
                    </span>
                  ) : item.promises.length > 0 ? (
                    <div>
                      <p className="font-semibold text-blue-600">Promised</p>
                      <p className="text-xs text-gray-500">
                        by {item.promises.map((p) => p.guestName).join(", ")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-gray-400">
                      Not yet promised
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} disabled={deleteItem.isPending}>
                  {deleteItem.isPending && deleteItem.variables?.itemId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
            <li className="py-4">
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={handleAddItem}
              >
                <input
                  type="text"
                  name="newItem"
                  placeholder="Add new item name"
                  className="grow rounded-md border border-gray-300 p-2 text-sm"
                  aria-label="New item name"
                  required
                />
                <input
                  type="number"
                  name="newItemPrice"
                  placeholder="Price (₦)"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm sm:w-32"
                  aria-label="New item price"
                  required
                />
                <Button type="submit" disabled={addItem.isPending}>
                  {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Item
                </Button>
              </form>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

