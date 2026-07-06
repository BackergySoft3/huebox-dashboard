import { useState } from "react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  email?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function UserAvatar({ avatarUrl, email, size = "sm", className = "" }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Only apply default size classes when className doesn't override dimensions
  const hasCustomSize = /\bw-\d|\bh-\d/.test(className);
  const sizeClass = hasCustomSize ? "" : size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-[10px]";
  const initial = email?.[0]?.toUpperCase() ?? "?";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={initial}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-1 ring-border/50 ${className}`.trim()}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0 ${className}`.trim()}>
      {initial}
    </div>
  );
}
