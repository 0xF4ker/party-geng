"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePostModal } from "@/stores/createPostModal";
import { useUpload } from "@/hooks/useUpload";
import { api } from "@/trpc/react";
import type { AssetType } from "@prisma/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Post = inferRouterOutputs<AppRouter>["post"]["getById"];

type AssetPreview = {
  key: string;
  url: string;
  file?: File;
  isNew: boolean;
};

// --- INNER COMPONENT: Handles Form Logic ---
const CreatePostForm = ({
  onClose,
  postToEdit,
}: {
  onClose: () => void;
  postToEdit: Post | null;
}) => {
  const { user } = useAuth();
  const { upload, isLoading: isUploading } = useUpload();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!postToEdit;

  // FIX: Initialize state directly from props.
  // Because we use a 'key' on the parent, this component re-mounts fresh
  // whenever postToEdit changes, so we don't need a useEffect to sync.
  const [caption, setCaption] = useState<string>(postToEdit?.caption ?? "");

  const [assets, setAssets] = useState<AssetPreview[]>(() => {
    if (postToEdit?.assets) {
      return postToEdit.assets.map((asset) => ({
        key: asset.id,
        url: asset.url,
        isNew: false,
      }));
    }
    return [];
  });

  const createPostMutation = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully!");
      onClose();
      void utils.post.getTrending.invalidate();
      if (user?.username) {
        void utils.post.getForUser.invalidate({ username: user.username });
      }
    },
    onError: (error) => {
      toast.error("Failed to create post", { description: error.message });
    },
  });

  const updatePostMutation = api.post.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully!");
      onClose();
      if (postToEdit) {
        void utils.post.getById.invalidate({ id: postToEdit.id });
      }
      void utils.post.getTrending.invalidate();
      if (user?.username) {
        void utils.post.getForUser.invalidate({ username: user.username });
      }
    },
    onError: (error) => {
      toast.error("Failed to update post", { description: error.message });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      key: file.name + Date.now(),
      file,
      url: URL.createObjectURL(file),
      isNew: true,
    }));
    setAssets((prev) => [...prev, ...newFiles].slice(0, 4));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm"],
    },
    noClick: true,
    noKeyboard: true,
  });

  const removeAsset = (keyToRemove: string) => {
    setAssets((prev) => prev.filter((a) => a.key !== keyToRemove));
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (assets.length === 0 && !caption.trim()) {
      toast.error("Please add some content to your post.");
      return;
    }

    const finalAssets: { url: string; type: AssetType; order: number }[] = [];
    let order = 0;

    for (const asset of assets) {
      if (asset.isNew && asset.file) {
        const publicUrl = await upload(asset.file, "posts");
        if (publicUrl) {
          finalAssets.push({
            url: publicUrl,
            type: asset.file.type.startsWith("image") ? "IMAGE" : "VIDEO",
            order: order++,
          });
        } else {
          toast.error(`Failed to upload ${asset.file.name}`);
          return;
        }
      } else if (!asset.isNew) {
        const originalAsset = postToEdit?.assets.find(
          (a) => a.id === asset.key,
        );
        if (originalAsset) {
          finalAssets.push({
            url: asset.url,
            type: originalAsset.type,
            order: order++,
          });
        }
      }
    }

    if (finalAssets.length === 0 && !caption.trim()) {
      toast.error("Cannot create an empty post.");
      return;
    }

    if (isEditing && postToEdit) {
      updatePostMutation.mutate({
        postId: postToEdit.id,
        caption,
        assets: finalAssets,
      });
    } else {
      createPostMutation.mutate({ caption, assets: finalAssets });
    }
  };

  const isLoading =
    isUploading || createPostMutation.isPending || updatePostMutation.isPending;

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-lg border-2 border-dashed p-4",
        isDragActive ? "border-pink-500" : "border-transparent",
      )}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      <div className="flex gap-4">
        <Image
          src={
            user?.clientProfile?.avatarUrl ??
            user?.vendorProfile?.avatarUrl ??
            "/default-avatar.png"
          }
          alt="author"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full"
        />
        <Textarea
          placeholder="What's happening?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="h-24 resize-none border-none text-lg shadow-none focus-visible:ring-0"
          maxLength={280}
        />
      </div>

      <AnimatePresence>
        {assets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("mt-4 grid gap-2", {
              "grid-cols-2": assets.length > 1,
              "grid-cols-1": assets.length === 1,
            })}
          >
            {assets.map((asset) => (
              <div
                key={asset.key}
                className="relative aspect-video overflow-hidden rounded-lg"
              >
                {asset.url.startsWith("blob:") ||
                (asset.file?.type.startsWith("image") ??
                  (!asset.file &&
                    /\.(jpeg|jpg|gif|png|webp)$/i.test(asset.url))) ? (
                  <Image
                    src={asset.url}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <video
                    src={asset.url}
                    controls
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAsset(asset.key);
                  }}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleIconClick();
          }}
          variant="ghost"
          size="icon"
          className="text-pink-500 hover:text-pink-600"
        >
          <ImagePlus />
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{caption.length} / 280</p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              void handleSubmit();
            }}
            disabled={isLoading || (!caption.trim() && assets.length === 0)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: Wrapper ---
export const CreatePostModal = () => {
  const { isOpen, onClose, postToEdit } = useCreatePostModal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {postToEdit ? "Edit Post" : "Create a new post"}
          </DialogTitle>
        </DialogHeader>
        {/* FIX: The 'key' prop here forces React to destroy and recreate the form 
          whenever we switch between creating a new post or editing a different one.
          This cleanly resets the state inside CreatePostForm without useEffects.
        */}
        <CreatePostForm
          key={postToEdit?.id ?? "create-new"}
          onClose={onClose}
          postToEdit={postToEdit}
        />
      </DialogContent>
    </Dialog>
  );
};
