import { UploadFolder } from "../Enums/UploadFolder.enum";

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface GenerateUploadUrlRequest {
  folder: UploadFolder;
  fileName: string;
  contentType: string;
  size: number;
}

export interface GenerateUploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

// ─── Hook contract ────────────────────────────────────────────────────────────

export interface FileUploadResult {
  key: string;
  publicUrl: string;
}

export interface FileUploadOptions {
  folder: UploadFolder;
  /** MIME types to accept. Defaults to images + PDF. */
  allowedTypes?: string[];
  /** Maximum file size in bytes. Defaults to 5 MB. */
  maxSizeBytes?: number;
  onSuccess?: (result: FileUploadResult) => void;
  onError?: (message: string) => void;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Component contract ───────────────────────────────────────────────────────

export interface FileUploaderProps
  extends Omit<FileUploadOptions, "onSuccess" | "onError"> {
  onSuccess?: (result: FileUploadResult) => void;
  onError?: (message: string) => void;
  /** Drop-zone label. */
  label?: string;
  /** Small hint text shown beneath the label (accepted types, size limit). */
  hint?: string;
  /** Show a preview thumbnail for image uploads. */
  previewImage?: boolean;
  className?: string;
}
