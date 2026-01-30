"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ImagePlus, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { AssetType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { useCreatePostModal } from "@/stores/createPostModal";
import { uploadPostAsset } from "@/lib/supabase-upload";
import { useAuthStore } from "@/stores/auth";
import { createClient } from "@/utils/supabase/client";

// --- VALIDATION SCHEMA ---
const createPostSchema = z.object({
  caption: z
    .string()
    .max(2200, "Caption cannot exceed 2200 characters")
    .optional(),
  assets: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.nativeEnum(AssetType),
        order: z.number().int(),
      }),
    )
    .min(1, "Please add at least one photo or video.")
    .max(10, "You can only upload up to 10 items."),
});

type CreatePostFormValues = z.infer<typeof createPostSchema>;

export const CreatePostModal = () => {
  const { isOpen, onClose, postToEdit } = useCreatePostModal();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Optional: Track X/Y files
  const utils = api.useUtils();

  const { profile } = useAuthStore();
  const userId = profile?.id;

  const supabase = createClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      caption: "",
      assets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets",
  });

  const captionValue = watch("caption") ?? "";

  // Sync Form with Store
  useEffect(() => {
    if (isOpen) {
      if (postToEdit) {
        reset({
          caption: postToEdit.caption ?? "",
          assets: postToEdit.assets.map((a) => ({
            url: a.url,
            type: a.type,
            order: a.order,
          })),
        });
      } else {
        reset({ caption: "", assets: [] });
      }
    }
  }, [isOpen, postToEdit, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  // --- TRPC MUTATIONS ---
  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully!");
      handleClose();
      void utils.post.getFeed.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePost = api.post.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully!");
      handleClose();
      void utils.post.getFeed.invalidate();
      if (postToEdit) {
        void utils.post.getById.invalidate({ id: postToEdit.id });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // --- REAL SUPABASE UPLOAD ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!userId) {
      toast.error("You must be logged in to upload.");
      return;
    }

    if (fields.length + files.length > 10) {
      toast.error("You can only have up to 10 items in a post.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);
      const uploadPromises = fileArray.map(async (file, index) => {
        try {
          const result = await uploadPostAsset(file, userId, supabase);
          // Update progress purely for visual feedback logic if needed
          setUploadProgress((prev) => prev + 1);
          return {
            ...result,
            order: fields.length + index,
          };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);

      // Filter out failed uploads (nulls)
      const successfulUploads = results.filter(
        (res): res is NonNullable<typeof res> => res !== null,
      );

      if (successfulUploads.length > 0) {
        append(successfulUploads);
      }
    } catch (error) {
      toast.error("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const onSubmit = (data: CreatePostFormValues) => {
    const orderedAssets = data.assets.map((asset, index) => ({
      ...asset,
      order: index,
    }));

    if (postToEdit) {
      updatePost.mutate({
        postId: postToEdit.id,
        caption: data.caption,
        assets: orderedAssets,
      });
    } else {
      createPost.mutate({
        caption: data.caption,
        assets: orderedAssets,
      });
    }
  };

  const isLoading =
    createPost.isPending || updatePost.isPending || isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && handleClose()}
    >
      <DialogContent className="z-100 max-h-[90vh] w-full max-w-xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {postToEdit ? "Edit Post" : "Create New Post"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
          {/* --- ASSET GRID --- */}
          <div className="space-y-2">
            <div
              className={cn(
                "grid gap-4 transition-all",
                fields.length === 0
                  ? "grid-cols-1"
                  : fields.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-2 sm:grid-cols-3",
              )}
            >
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                >
                  {field.type === "IMAGE" ? (
                    <Image
                      src={field.url}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={field.url}
                      className="h-full w-full object-cover"
                      controls={false} // Hide native controls for preview
                      muted
                      playsInline
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* UPLOAD BUTTON / DROPZONE */}
              {fields.length < 10 && (
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-100 hover:text-gray-600",
                    fields.length === 0
                      ? "aspect-video w-full py-12"
                      : "aspect-square",
                    isUploading && "cursor-not-allowed opacity-75",
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        <p className="mt-2 text-xs font-medium text-gray-500">
                          Uploading...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-3 rounded-full bg-gray-200 p-3 transition-colors group-hover:bg-gray-300">
                          <ImagePlus className="h-6 w-6 text-gray-600" />
                        </div>
                        <p className="text-sm font-semibold">
                          {fields.length === 0
                            ? "Add Photos/Video"
                            : "Add More"}
                        </p>
                        {fields.length === 0 && (
                          <p className="mt-1 text-xs text-gray-400">
                            Max 10 files
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
            {errors.assets && (
              <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                <AlertCircle className="h-4 w-4" />
                {errors.assets.message}
              </div>
            )}
          </div>

          {/* --- CAPTION --- */}
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                {...register("caption")}
                placeholder="Write a caption..."
                className="scrollbar-thin min-h-[120px] resize-y border-gray-200 pr-2 pb-8 text-base leading-relaxed focus:ring-pink-500"
                disabled={isLoading}
              />
              <div className="pointer-events-none absolute right-3 bottom-2 bg-white px-1 text-xs font-medium text-gray-400">
                <span
                  className={cn(
                    captionValue.length > 2200
                      ? "font-bold text-red-500"
                      : "text-gray-600",
                  )}
                >
                  {captionValue.length.toLocaleString()}
                </span>
                /2,200
              </div>
            </div>
            {errors.caption && (
              <p className="text-sm text-red-500">{errors.caption.message}</p>
            )}
          </div>

          {/* --- FOOTER --- */}
          <div className="flex items-center justify-end border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading || fields.length === 0}
              className="w-full min-w-[120px] bg-pink-600 font-semibold text-white hover:bg-pink-700 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {postToEdit ? "Updating..." : "Posting..."}
                </>
              ) : (
                <>{postToEdit ? "Save Changes" : "Share"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
