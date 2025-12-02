"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Check, Copy, Pencil, Trash2, DollarSign, Gift } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { WishlistItemType } from "@prisma/client";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];
type wishlistItem = NonNullable<event["wishlist"]>["items"][number];

interface WishlistModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistModal = ({
  event,
  isOpen,
  onClose,
}: WishlistModalProps) => {
  const [copied, setCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<wishlistItem | null>(null);
  const [newItemImageUrl, setNewItemImageUrl] = useState<string | undefined>(undefined);
  const [newItemType, setNewItemType] = useState<WishlistItemType>(WishlistItemType.ITEM_REQUEST);
  const utils = api.useUtils();

  const addItem = api.wishlist.addItem.useMutation({
    onSuccess: () => {
        void utils.event.getById.invalidate({ id: event.id });
        setNewItemImageUrl(undefined);
    },
  });

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

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newItemName = (form.elements.namedItem("newItemName") as HTMLInputElement)?.value;
    const requestedAmount = (form.elements.namedItem("requestedAmount") as HTMLInputElement)?.value;

    if (!newItemName) return;

    addItem.mutate({
      eventId: event.id,
      name: newItemName,
      itemType: newItemType,
      requestedAmount: requestedAmount ? Number(requestedAmount) : undefined,
      imageUrl: newItemType === WishlistItemType.ITEM_REQUEST ? newItemImageUrl : undefined,
    });
    form.reset();
    setNewItemImageUrl(undefined);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[100vh] max-w-3xl overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{event.title}&apos;s Wishlist</DialogTitle>
          <DialogDescription>
            Manage your event&apos;s wishlist. Add, edit, or remove items as you wish.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border-t pt-4">
          <Label className="text-sm font-medium">Shareable Link</Label>
          <div className="mt-2 flex gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/wishlist/${event.id}`}
              className="bg-gray-100"
            />
            <Button onClick={copyLink} disabled={copied} variant="outline">
              {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h4 className="mb-4 font-semibold">Add New Item</h4>
          <div className="mb-4 flex justify-center rounded-md bg-gray-100 p-1">
            <Button
              onClick={() => setNewItemType(WishlistItemType.ITEM_REQUEST)}
              className={cn("flex-1", newItemType === WishlistItemType.ITEM_REQUEST ? "bg-white shadow-sm text-pink-600" : "bg-transparent text-gray-500 hover:text-white")}
            >
              <Gift className="mr-2 h-4 w-4" /> Item Request
            </Button>
            <Button
              onClick={() => setNewItemType(WishlistItemType.CASH_REQUEST)}
              className={cn("flex-1", newItemType === WishlistItemType.CASH_REQUEST ? "bg-white shadow-sm text-pink-600" : "bg-transparent text-gray-500 hover:text-white")}
            >
              <DollarSign className="mr-2 h-4 w-4" /> Cash Request
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleAddItem}>
            <div>
              <Label htmlFor="newItemName">Name</Label>
              <Input
                name="newItemName"
                placeholder={newItemType === WishlistItemType.ITEM_REQUEST ? "e.g., Custom Birthday Cake" : "e.g., Honeymoon Fund"}
                required
              />
            </div>

            {newItemType === WishlistItemType.CASH_REQUEST && (
              <div>
                <Label htmlFor="requestedAmount">Requested Amount (₦)</Label>
                <Input
                  name="requestedAmount"
                  type="number"
                  placeholder="e.g., 50000"
                  required
                />
              </div>
            )}

            {newItemType === WishlistItemType.ITEM_REQUEST && (
              <div>
                <ImageUpload
                  bucket="wishlist-images"
                  fileName={`wishlist-item-new-${Date.now()}`}
                  onUploadComplete={(url) => setNewItemImageUrl(url)}
                  label="Item Image"
                  currentImage={newItemImageUrl}
                />
              </div>
            )}
            
            <div>
              <Button type="submit" disabled={addItem.isPending} className="w-full">
                {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-4 h-[300px] overflow-y-auto border-t pt-4 pr-2">
          <h4 className="mb-2 font-semibold">Wishlist Items</h4>
          <ul className="space-y-2">
            {event.wishlist?.items.map((item) => (
              <WishlistItemRow
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                isEditing={editingItem?.id === item.id}
                onCancelEdit={() => setEditingItem(null)}
                eventId={event.id}
              />
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WishlistItemRow = ({ item, onEdit, isEditing, onCancelEdit, eventId }: { item: wishlistItem; onEdit: () => void; isEditing: boolean; onCancelEdit: () => void; eventId: string; }) => {
  const utils = api.useUtils();
  const [name, setName] = useState(item.name);
  const [requestedAmount, setRequestedAmount] = useState(item.requestedAmount ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");

  const updateItem = api.wishlist.updateItem.useMutation({
    onSuccess: () => {
      void utils.event.getById.invalidate({ id: eventId });
      onCancelEdit();
    },
  });

  const deleteItem = api.wishlist.deleteItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });

  const handleUpdate = () => {
    if (!name.trim()) return;
    updateItem.mutate({
      itemId: item.id,
      name: name,
      requestedAmount: requestedAmount ? Number(requestedAmount) : undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  const handleToggleFulfilled = () => {
    updateItem.mutate({ itemId: item.id, isFulfilled: !item.isFulfilled });
  };

  if (isEditing) {
    return (
      <li className="space-y-2 rounded-lg bg-gray-50 p-2">
        <div>
          <Label htmlFor="editItemName">Item Name</Label>
          <Input id="editItemName" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {item.itemType === 'CASH_REQUEST' ? (
          <div>
            <Label htmlFor="editRequestedAmount">Requested Amount (₦)</Label>
            <Input id="editRequestedAmount" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} type="number" placeholder="Amount" />
          </div>
        ) : (
          <div>
            <ImageUpload
              currentImage={imageUrl}
              bucket="wishlist-images"
              fileName={`wishlist-item-${item.id}`}
              onUploadComplete={(url) => setImageUrl(url)}
              label="Item Image"
            />
          </div>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={handleUpdate} size="sm" disabled={updateItem.isPending}>
            {updateItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button onClick={onCancelEdit} size="sm" variant="ghost">
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-50">
      <input
        type="checkbox"
        checked={item.isFulfilled}
        onChange={handleToggleFulfilled}
        disabled={updateItem.isPending}
        className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
      />
      <div className="flex-grow">
        <p className={cn("font-medium", item.isFulfilled && "text-gray-400 line-through")}>
          {item.name}
        </p>
        <p className="text-sm text-gray-500">
          {item.itemType === 'CASH_REQUEST' 
            ? `Cash Request: ₦${(item.requestedAmount ?? 0).toLocaleString()}`
            : 'Item Request'}
        </p>
      </div>
      <div className="text-right">
        {item.isFulfilled ? (
          <span className="text-sm font-semibold text-green-600">Fulfilled</span>
        ) : item.contributions.length > 0 ? (
          <span className="text-sm font-semibold text-blue-600">
            Contributed by {item.contributions.length} {item.contributions.length > 1 ? "people" : "person"}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Not contributed</span>
        )}
      </div>
      <div className="flex">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4 text-gray-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteItem.mutate({ itemId: item.id })}
          disabled={deleteItem.isPending}
        >
          {deleteItem.isPending && deleteItem.variables?.itemId === item.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-red-500" />
          )}
        </Button>
      </div>
    </li>
  );
};

