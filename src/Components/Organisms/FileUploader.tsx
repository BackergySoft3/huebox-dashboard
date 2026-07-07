import { useRef, useState, useCallback } from "react";
import { Upload, X, CheckCircle, AlertTriangle, FileText, ImageIcon } from "lucide-react";
import { cn } from "../../Helpers/utils";
import { useFileUpload } from "../../Hooks/useFileUpload";
import type { FileUploaderProps } from "../../Interfaces/s3";

export function FileUploader({
  folder,
  allowedTypes,
  maxSizeBytes,
  onSuccess,
  onError,
  label,
  hint,
  previewImage = false,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const { upload, progress, isUploading, error, result, reset } = useFileUpload({
    folder,
    allowedTypes,
    maxSizeBytes,
    onSuccess,
    onError,
  });

  const handleFile = useCallback(
    async (file: File) => {
      if (previewImage && file.type.startsWith("image/")) {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
      }
      await upload(file);
    },
    [upload, previewImage, preview],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (inputRef.current) inputRef.current.value = "";
    reset();
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}

      {/* ── Drop zone (hidden once upload succeeds) ── */}
      {!result && (
        <div
          role="button"
          tabIndex={isUploading ? -1 : 0}
          aria-label="File upload drop zone"
          onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={(e) =>
            e.key === "Enter" && !isUploading && inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            !isUploading && "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border/50 bg-card/30",
            isUploading && "pointer-events-none",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={allowedTypes?.join(",")}
            className="hidden"
            onChange={handleInputChange}
            disabled={isUploading}
          />

          {isUploading ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">Uploading…</p>
              {/* Progress bar */}
              <div className="w-full max-w-[12rem] overflow-hidden rounded-full bg-muted h-1.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-primary">{progress}%</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {previewImage ? (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium">
                  Drop file here or{" "}
                  <span className="text-primary underline underline-offset-2">
                    browse
                  </span>
                </p>
                {hint && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Success state ── */}
      {result && (
        <div className="relative flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          {preview ? (
            <img
              src={preview}
              alt="Uploaded preview"
              className="h-12 w-12 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-emerald-500/20">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Upload complete
            </p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {result.key}
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            aria-label="Remove uploaded file"
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Inline error ── */}
      {error && (
        <p className="flex items-center gap-1.5 font-mono text-[10px] text-rose-500">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
