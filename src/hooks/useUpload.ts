"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compressImage } from "@/lib/image-compression";
import { checkFileSize } from "@/lib/file-size-check";

type UploadResult = {
  publicUrl: string | null;
  error: string | null;
  isLoading: boolean;
  upload: (file: File, bucket: string) => Promise<string | null>;
};

export const useUpload = (): UploadResult => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  const supabase = createClient();

  const upload = async (file: File, bucket: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    setPublicUrl(null);

    if (!user) {
      const authError = "User must be authenticated to upload files.";
      setError(authError);
      setIsLoading(false);
      return null;
    }
    
    if (!checkFileSize(file)) {
        const sizeError = "File exceeds the 10MB size limit.";
        setError(sizeError);
        setIsLoading(false);
        return null;
    }

    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        fileToUpload = await compressImage(file);
      }
      
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      setPublicUrl(publicUrl);
      setIsLoading(false);
      return publicUrl;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during upload.";
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  return { publicUrl, error, isLoading, upload };
};
