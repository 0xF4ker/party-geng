"use client";

import { useCallback, useState, useRef } from "react";
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

type FilePreview = {
  file: File;
  preview: string;
};

export const CreatePostModal = () => {
  const { user } = useAuth();
  const { isOpen, onClose } = useCreatePostModal();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [caption, setCaption] = useState("");
  const { upload, isLoading: isUploading } = useUpload();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: createPostMutation, isPending } = api.post.create.useMutation(
    {
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
    },
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newFiles].slice(0, 4)); // Limit to 4 files
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

  const removeFile = (previewToRemove: string) => {
    setFiles((prev) => prev.filter((f) => f.preview !== previewToRemove));
  };
  
  const handleIconClick = () => {
      fileInputRef.current?.click();
  }

  const handleClose = () => {
    setFiles([]);
    setCaption("");
    onClose();
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !caption.trim()) {
      toast.error("Please add some content to your post.");
      return;
    }

    const uploadedAssets: { url: string; type: AssetType; order: number }[] =
      [];

    for (const [index, filePreview] of files.entries()) {
      const publicUrl = await upload(filePreview.file, "posts");
      if (publicUrl) {
        uploadedAssets.push({
          url: publicUrl,
          type: filePreview.file.type.startsWith("image") ? "IMAGE" : "VIDEO",
          order: index,
        });
      } else {
        toast.error(`Failed to upload ${filePreview.file.name}`);
        return;
      }
    }

    // Allow posting text-only posts
    if (uploadedAssets.length === 0 && !caption.trim()) {
      toast.error("Cannot create an empty post.");
      return;
    }

    createPostMutation({ caption, assets: uploadedAssets });
  };

  const isLoading = isUploading ?? isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
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
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={cn("mt-4 grid gap-2", {
                  "grid-cols-2": files.length > 1,
                  "grid-cols-1": files.length === 1,
                })}
              >
                {files.map((filePreview) => (
                  <div
                    key={filePreview.preview}
                    className="relative aspect-video overflow-hidden rounded-lg"
                  >
                    {filePreview.file.type.startsWith("image") ? (
                      <Image
                        src={filePreview.preview}
                        alt="preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={filePreview.preview}
                        controls
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeFile(filePreview.preview)}
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
                disabled={isLoading || (!caption.trim() && files.length === 0)}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
