export const UploadFolder = {
  AVATARS: "avatars",
  KYC: "kyc",
  DOCUMENTS: "documents",
  ASSETS: "assets",
  TEMP: "temp",
  EXPORTS: "exports",
} as const;

export type UploadFolder = (typeof UploadFolder)[keyof typeof UploadFolder];
