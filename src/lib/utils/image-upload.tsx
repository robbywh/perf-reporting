"use client";

import { useState } from "react";
import { toast } from "sonner";

import { uploadFile } from "@/actions/coding-hours";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/types/common";

/**
 * Custom hook for handling image uploads with validation and progress state
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  /**
   * Validates file size and type
   */
  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 5MB.");
      return false;
    }

    // Check file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG and WebP are supported.");
      return false;
    }

    return true;
  };

  /**
   * Handles file upload with validation and progress tracking
   */
  const handleFileUpload = async (
    file: File,
    fileName: string,
    filePath: string,
  ): Promise<string | null> => {
    if (!validateFile(file)) return null;

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadFile({
        file,
        fileName,
        filePath,
      });
      return uploadedUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    setIsUploading,
    isImageLoading,
    setIsImageLoading,
    validateFile,
    handleFileUpload,
  };
}
