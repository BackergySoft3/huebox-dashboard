import { api } from "./http.service";
import { S3_ENDPOINTS } from "../Constants/apiEndpoints";
import type {
  GenerateUploadUrlRequest,
  GenerateUploadUrlResponse,
} from "../Interfaces/s3";

/**
 * Asks NestJS to validate the file and issue a pre-signed PUT URL.
 * Uses the shared axios instance so the JWT is attached automatically.
 */
async function generateUploadUrl(
  payload: GenerateUploadUrlRequest,
): Promise<GenerateUploadUrlResponse> {
  const { data } = await api.post<GenerateUploadUrlResponse>(
    S3_ENDPOINTS.UPLOAD_URL,
    payload,
  );
  return data;
}

/**
 * Uploads a file directly to S3 using the pre-signed PUT URL.
 *
 * Uses XMLHttpRequest instead of axios/fetch so that upload progress events
 * are available. The Authorization header is intentionally omitted — the
 * pre-signed URL already carries AWS credentials as query params.
 */
function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      // S3 returns 200 for a successful PUT
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed (HTTP ${xhr.status}).`));
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload. Check your connection.")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload was cancelled.")),
    );

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-amz-server-side-encryption", "AES256");
    xhr.send(file);
  });
}

/**
 * Asks NestJS to permanently delete an S3 object by its key.
 * Admin-only on the backend.
 */
async function deleteFile(key: string): Promise<void> {
  await api.delete(S3_ENDPOINTS.FILE, { data: { key } });
}

/**
 * Returns a temporary signed download URL for a private S3 object.
 * Use this for KYC documents; use publicUrl directly for avatars/assets.
 */
async function getDownloadUrl(key: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(S3_ENDPOINTS.DOWNLOAD_URL, {
    params: { key },
  });
  return data.url;
}

export const s3Api = {
  generateUploadUrl,
  uploadToS3,
  deleteFile,
  getDownloadUrl,
};
