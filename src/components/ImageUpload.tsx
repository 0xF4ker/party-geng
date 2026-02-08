"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  currentImage?: string | null;
  onUploadComplete: (url: string) => void;
  bucket: "profile-images" | "kyc-documents" | "wishlist-images" | "posts";
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
  fileName: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onUploadComplete,
  bucket,
  fileName,
  accept = "image/*",
  maxSizeMB = 5,
  label = "Upload Image",
  description = "PNG, JPG up to 5MB",
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // --- FIX: Sync preview with currentImage prop ---
  useEffect(() => {
    // Only update if we aren't currently uploading (to avoid jitter)
    if (!uploading && currentImage !== undefined) {
      setPreview(currentImage);
    }
  }, [currentImage, uploading]);

  // Parse the file path from an existing URL (for removal)
  const getPathFromUrl = (url: string) => {
    try {
      const { pathname } = new URL(url);
      // Path is /storage/v1/object/public/bucket-name/file-path
      const path = pathname.split(`/${bucket}/`)[1]!;
      return path;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (accept === "image/*" && !file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to upload files");
        setPreview(null);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const stableFilePath = `${user.id}/${fileName}.${fileExt}`;
      setUploadedFilePath(stableFilePath);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(stableFilePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      let publicUrl: string;

      if (bucket === "profile-images") {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(stableFilePath);

        publicUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      } else {
        const { data: urlData, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(stableFilePath, 60 * 60 * 24 * 365);

        if (urlError) throw urlError;
        publicUrl = urlData.signedUrl;
      }

      URL.revokeObjectURL(localPreview);
      setPreview(publicUrl);
      onUploadComplete(publicUrl);

      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    let fileToRemove = uploadedFilePath;

    if (!fileToRemove && (currentImage || preview)) {
      fileToRemove = getPathFromUrl(preview ?? currentImage!);
    }

    if (fileToRemove) {
      try {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([fileToRemove]);
        if (error) throw error;
        toast.success("Image removed.");
      } catch (error) {
        console.error("Remove error:", error);
        toast.error("Could not remove file from storage.");
        return;
      }
    }

    setPreview(null);
    setUploadedFilePath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUploadComplete("");
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      {preview ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-lg border-2 border-gray-200 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-white" />
                <p className="mt-2 text-xs font-semibold text-white">
                  {uploadProgress}%
                </p>
              </div>
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          className="flex cursor-pointer justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 transition-colors hover:border-gray-400"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            {uploading ? (
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
            ) : (
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <div className="flex text-sm text-gray-600">
              <span className="relative cursor-pointer rounded-md bg-white font-medium text-pink-600 focus-within:outline-none hover:text-pink-500">
                {uploading ? "Uploading..." : "Upload a file"}
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
        disabled={uploading}
      />
    </div>
  );
};
