"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, X, ImagePlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

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

type AssetPreview = {
  key: string;
  url: string;
  file?: File;
  isNew: boolean;
};

export const CreatePostModal = () => {
  const { user } = useAuth();
  const { isOpen, onClose, postToEdit } = useCreatePostModal();
  const [assets, setAssets] = useState<AssetPreview[]>([]);
  const [caption, setCaption] = useState("");
  const { upload, isLoading: isUploading } = useUpload();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!postToEdit;

  useEffect(() => {
    if (isOpen && postToEdit) {
      setCaption(postToEdit.caption ?? "");
      setAssets(
        postToEdit.assets.map((asset) => ({
          key: asset.id,
          url: asset.url,
          isNew: false,
        })),
      );
    }
  }, [isOpen, postToEdit]);

  const createPostMutation = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully!");
      handleClose();
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
      handleClose();
      void utils.post.getById.invalidate({ id: postToEdit!.id });
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
    setAssets((prev) => [...prev, ...newFiles].slice(0, 4)); // Limit to 4 files
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

  const handleClose = () => {
    setAssets([]);
    setCaption("");
    onClose();
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
        // This is an existing asset. Find its type from postToEdit.
        // It's already available in the postToEdit.assets map when setting state initially.
        // asset.key is asset.id in this case.
        const originalAsset = postToEdit?.assets.find(a => a.id === asset.key);
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

    if (isEditing) {
        updatePostMutation.mutate({ postId: postToEdit.id, caption, assets: finalAssets });
    } else {
        createPostMutation.mutate({ caption, assets: finalAssets });
    }
  };

  const isLoading = isUploading || createPostMutation.isPending || updatePostMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Post" : "Create a new post"}</DialogTitle>
        </DialogHeader>

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
                    {asset.url.startsWith("blob:") || (asset.file?.type.startsWith("image") || (!asset.file && /\.(jpeg|jpg|gif|png|webp)$/i.test(asset.url))) ? (
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
                      onClick={() => removeAsset(asset.key)}
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
              onClick={handleIconClick}
              variant="ghost"
              size="icon"
              className="text-pink-500 hover:text-pink-600"
            >
              <ImagePlus />
            </Button>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">{caption.length} / 280</p>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!caption.trim() && assets.length === 0)}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
