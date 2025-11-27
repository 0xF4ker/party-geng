"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Check, Copy, Pencil, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload"; // Import ImageUpload

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
  const [newItemImageUrl, setNewItemImageUrl] = useState<string | undefined>(
    undefined,
  ); // State for new item image
  const utils = api.useUtils();

  const addItem = api.wishlist.addItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: event.id }),
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
    const newItemName = (form.elements.namedItem("newItem") as HTMLInputElement)
      ?.value;
    const newItemPrice = (
      form.elements.namedItem("newItemPrice") as HTMLInputElement
    )?.value;
    // const newItemImageUrl = (
    //   form.elements.namedItem("newItemImageUrl") as HTMLInputElement
    // )?.value; // Now from state
    const newItemStoreUrl = (
      form.elements.namedItem("newItemStoreUrl") as HTMLInputElement
    )?.value;
    const newItemStoreName = (
      form.elements.namedItem("newItemStoreName") as HTMLInputElement
    )?.value;
    const newItemCashContribution = (
      form.elements.namedItem("newItemCashContribution") as HTMLInputElement
    )?.checked;

    if (!newItemName) return;

    addItem.mutate({
      eventId: event.id,
      name: newItemName,
      price: newItemPrice ? Number(newItemPrice) : undefined,
      imageUrl: newItemImageUrl ?? undefined, // Use state here
      storeUrl: newItemStoreUrl || undefined,
      storeName: newItemStoreName || undefined,
      cashContribution: newItemCashContribution,
    });
    form.reset();
    setNewItemImageUrl(undefined); // Clear image state after adding
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[100vh] max-w-3xl overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{event.title}&apos;s Wishlist</DialogTitle>
          <DialogDescription>
            Manage your event&apos;s wishlist. Add, edit, or remove items as you
            wish.
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
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 font-semibold">Add New Item</h4>
          <form
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={handleAddItem}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="newItem">Item Name</Label>
              <Input
                name="newItem"
                placeholder="e.g., Custom Birthday Cake"
                required
              />
            </div>
            <div>
              <Label htmlFor="newItemPrice">Estimated Price (₦)</Label>
              <Input
                name="newItemPrice"
                type="number"
                placeholder="e.g., 50000"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload
                bucket="wishlist-images"
                fileName={`wishlist-item-new-${Date.now()}`} // Unique name for new item
                onUploadComplete={(url) => setNewItemImageUrl(url)}
                label="Item Image"
                currentImage={newItemImageUrl} // Pass current image for preview
              />
            </div>
            <div>
              <Label htmlFor="newItemStoreUrl">Store URL</Label>
              <Input
                name="newItemStoreUrl"
                type="url"
                placeholder="e.g., https://amazon.com/item"
              />
            </div>
            <div>
              <Label htmlFor="newItemStoreName">Store Name</Label>
              <Input name="newItemStoreName" placeholder="e.g., Amazon" />
            </div>
            <div className="flex items-center space-x-2 sm:col-span-2">
              <Checkbox
                id="newItemCashContribution"
                name="newItemCashContribution"
              />
              <Label htmlFor="newItemCashContribution">
                Allow cash contributions
              </Label>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={addItem.isPending}
                className="w-full"
              >
                {addItem.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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

// --- Sub-component for each wishlist item row ---
const WishlistItemRow = ({
  item,
  onEdit,
  isEditing,
  onCancelEdit,
  eventId,
}: {
  item: wishlistItem;
  onEdit: () => void;
  isEditing: boolean;
  onCancelEdit: () => void;
  eventId: string;
}) => {
  const utils = api.useUtils();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [storeUrl, setStoreUrl] = useState(item.storeUrl ?? "");
  const [storeName, setStoreName] = useState(item.storeName ?? "");
  const [cashContribution, setCashContribution] = useState(
    item.cashContribution ?? false,
  );

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
      price: price ? Number(price) : undefined,
      imageUrl: imageUrl || undefined,
      storeUrl: storeUrl || undefined,
      storeName: storeName || undefined,
      cashContribution: cashContribution,
    });
  };

  const handleToggleFulfilled = () => {
    updateItem.mutate({ itemId: item.id, isFulfilled: !item.isFulfilled });
  };

  if (isEditing) {
    return (
      <li className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 p-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="editItemName" className="sr-only">
            Item Name
          </Label>
          <Input
            id="editItemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow"
          />
        </div>
        <div>
          <Label htmlFor="editItemPrice" className="sr-only">
            Estimated Price
          </Label>
          <Input
            id="editItemPrice"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            placeholder="Price (₦)"
          />
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            currentImage={imageUrl}
            bucket="wishlist-images"
            fileName={`wishlist-item-${item.id}`} // Stable name for existing item
            onUploadComplete={(url) => setImageUrl(url)}
            label="Item Image"
          />
        </div>
        <div>
          <Label htmlFor="editItemStoreUrl" className="sr-only">
            Store URL
          </Label>
          <Input
            id="editItemStoreUrl"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            type="url"
            placeholder="Store URL"
          />
        </div>
        <div>
          <Label htmlFor="editItemStoreName" className="sr-only">
            Store Name
          </Label>
          <Input
            id="editItemStoreName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store Name"
          />
        </div>
        <div className="flex items-center space-x-2 sm:col-span-2">
          <Checkbox
            id="editItemCashContribution"
            checked={cashContribution}
            onCheckedChange={(checked) =>
              setCashContribution(checked as boolean)
            }
          />
          <Label htmlFor="editItemCashContribution">
            Allow cash contributions
          </Label>
        </div>
        <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            disabled={updateItem.isPending}
          >
            {updateItem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
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
        <p
          className={cn(
            "font-medium",
            item.isFulfilled && "text-gray-400 line-through",
          )}
        >
          {item.name}
        </p>
        <p className="text-sm text-gray-500">
          {item.price ? `Est. ₦${item.price.toLocaleString()}` : "No price set"}
        </p>
      </div>
      <div className="text-right">
        {item.isFulfilled ? (
          <span className="text-sm font-semibold text-green-600">
            Fulfilled
          </span>
        ) : item.contributions.length > 0 ? (
          <span className="text-sm font-semibold text-blue-600">
            Contributed by {item.contributions.length}{" "}
            {item.contributions.length > 1 ? "people" : "person"}
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
