import { v4 as uuidv4 } from "uuid";
import { supabase, supabaseStorageBucket } from "../lib/supabase";

export const uploadPdfToStorage = async (file, folder = "uploads") => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  const sanitizedName = file.name.replace(/\s+/g, "_");
  const storedFileName = `${uuidv4()}-${sanitizedName}`;
  const filePath = `${folder}/${storedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/pdf",
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(supabaseStorageBucket)
    .getPublicUrl(filePath);

  return {
    fileName: storedFileName,
    filePath,
    fileUrl: data.publicUrl,
  };
};
