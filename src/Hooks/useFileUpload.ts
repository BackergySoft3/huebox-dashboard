import { useState, useCallback, useRef, useEffect } from "react";
import { s3Api } from "../Services/s3Api";
import type {
  FileUploadOptions,
  FileUploadResult,
  FileValidationResult,
} from "../Interfaces/s3";

const DEFAULT_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number,
): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    const readable = allowedTypes
      .map((t) => t.split("/")[1].toUpperCase())
      .join(", ");
    return {
      valid: false,
      error: `"${file.name}" is not an accepted file type. Allowed: ${readable}.`,
    };
  }
  if (file.size > maxSizeBytes) {
    const limitMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is ${actualMB} MB — exceeds the ${limitMB} MB limit.`,
    };
  }
  return { valid: true };
}

export function useFileUpload(options: FileUploadOptions) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FileUploadResult | null>(null);

  // Keep callback refs stable so `upload` doesn't need them as deps
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  useEffect(() => { onSuccessRef.current = options.onSuccess; }, [options.onSuccess]);
  useEffect(() => { onErrorRef.current = options.onError; }, [options.onError]);

  const allowedTypes = options.allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_BYTES;
  const { folder } = options;

  const upload = useCallback(
    async (file: File): Promise<FileUploadResult | null> => {
      setError(null);
      setProgress(0);
      setResult(null);

      // Validate before making any network call
      const validation = validateFile(file, allowedTypes, maxSizeBytes);
      if (!validation.valid) {
        setError(validation.error!);
        onErrorRef.current?.(validation.error!);
        return null;
      }

      setIsUploading(true);
      try {
        // Step 1 — NestJS issues a pre-signed PUT URL
        const { uploadUrl, key, publicUrl } = await s3Api.generateUploadUrl({
          folder,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        });

        // Step 2 — Upload directly to S3 (no auth header, XHR for progress)
        await s3Api.uploadToS3(uploadUrl, file, setProgress);

        const uploadResult: FileUploadResult = { key, publicUrl };
        setResult(uploadResult);
        setProgress(100);
        onSuccessRef.current?.(uploadResult);
        return uploadResult;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(message);
        onErrorRef.current?.(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    // allowedTypes array identity changes each render if the caller doesn't memoize it,
    // so we intentionally keep the dep list flat — folder/sizes are primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folder, maxSizeBytes],
  );

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
    setResult(null);
  }, []);

  return { upload, progress, isUploading, error, result, reset };
}
