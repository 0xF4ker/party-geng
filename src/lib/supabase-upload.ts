import { type SupabaseClient } from "@supabase/supabase-js";
import { compressImage } from "@/lib/image-compression";
import { type AssetType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// UPDATED: Bucket name must match your policy EXACTLY
const BUCKET_NAME = "posts";

export interface UploadResult {
  url: string;
  type: AssetType;
}

export const uploadPostAsset = async (
  file: File,
  userId: string,
  supabase: SupabaseClient, // UPDATED: Accept authenticated client
): Promise<UploadResult> => {
  try {
    // --- 1. INSPECTION LOGS (Check your Browser Console) ---
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.group("🔍 Supabase Upload Inspector");
    console.log("Target Bucket:", BUCKET_NAME);
    console.log("File Name:", file.name);
    console.log("User ID (Passed):", userId);
    console.log("User ID (Auth Session):", session?.user?.id);

    if (session?.user?.id !== userId) {
      console.error(
        "❌ CRITICAL ERROR: The authenticated user does not match the userId passed for the folder path. RLS will block this.",
      );
    } else {
      console.log("✅ Auth Match: Session ID matches Folder Path ID.");
    }
    // -------------------------------------------------------

    let fileToUpload = file;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) throw new Error("Unsupported file type");

    if (isImage) {
      try {
        fileToUpload = await compressImage(file);
      } catch (error) {
        console.warn("Compression failed, uploading original file", error);
      }
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;

    // Policy expects: ((storage.foldername(name))[1] = (auth.uid())::text)
    // This means structure MUST be: userId/filename
    const filePath = `${userId}/${fileName}`;
    console.log("Generated Path:", filePath);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Supabase Upload Error Details:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    console.log("✅ Upload Success:", data.publicUrl);
    console.groupEnd();

    return {
      url: data.publicUrl,
      type: isVideo ? "VIDEO" : "IMAGE",
    };
  } catch (error) {
    console.groupEnd();
    console.error("Upload process failed:", error);
    throw new Error("Failed to upload asset");
  }
};
