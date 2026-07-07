import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  FileEdit,
  Globe,
  Archive,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import axios from "axios";

import { newsApi } from "../Services/newsApi";
import { Card, CardContent } from "../Components/Atoms/card";
import { Badge } from "../Components/Atoms/badge";
import { Button } from "../Components/Atoms/button";
import { Input } from "../Components/Atoms/input";
import { ConfirmModal } from "../Components/Organisms/ConfirmModal";
import { cn } from "../Helpers/utils";

interface NewsPost {
  _id?: string;
  id?: string;
  title: string;
  subject: string;
  details: string;
  imageUrl?: string;
  imageKey?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  createdAt?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function AdminNews() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<NewsPost | null>(null);

  // Form local state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch admin news list using tanstack query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-news", page, statusFilter],
    queryFn: () =>
      newsApi.listAll({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const newsPosts: NewsPost[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;


  const handleOpenCreate = () => {
    setSelectedPost(null);
    setTitle("");
    setSubject("");
    setDetails("");
    setImageUrl("");
    setImageKey("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (post: NewsPost) => {
    setSelectedPost(post);
    setTitle(post.title);
    setSubject(post.subject);
    setDetails(post.details);
    setImageUrl(post.imageUrl || "");
    setImageKey(post.imageKey || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds the 5MB limit.");
      return;
    }

    // Validate format
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Unsupported file type. Please upload a PNG, JPEG, or WebP image.");
      return;
    }

    setIsUploading(true);
    setFormError(null);

    try {
      const uploadDetails = await newsApi.requestUploadUrl(file.type, file.name);

      const formData = new FormData();
      Object.entries(uploadDetails.fields).forEach(([key, val]) => {
        formData.append(key, val as string);
      });
      formData.append("file", file);

      await axios.post(uploadDetails.uploadUrl, formData);

      setImageUrl(uploadDetails.objectUrl);
      setImageKey(uploadDetails.key);
    } catch {
      console.error("News image upload failed");
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageKey("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !details.trim()) return;

    if (title.length > 150) {
      setFormError("Title must not exceed 150 characters.");
      return;
    }

    if (subject.length > 250) {
      setFormError("Subject must not exceed 250 characters.");
      return;
    }

    setFormError(null);
    setIsUploading(true);

    try {
      const payload = {
        title,
        subject,
        details,
        imageKey: imageKey || undefined,
        imageUrl: imageUrl || undefined,
      };

      if (selectedPost) {
        // Edit post
        await newsApi.update((selectedPost._id || selectedPost.id)!, {
          title,
          subject,
          details,
          imageKey: imageKey || null,
          imageUrl: imageUrl || null,
        });
      } else {
        // Create post
        await newsApi.create(payload);
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: unknown) {
      setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "An error occurred while saving the post.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async (post: NewsPost) => {
    try {
      await newsApi.publish(post._id || post.id!);
      refetch();
    } catch {
      alert("Failed to publish the post.");
    }
  };

  const handleArchive = async (post: NewsPost) => {
    try {
      await newsApi.archive(post._id || post.id!);
      refetch();
    } catch {
      alert("Failed to archive the post.");
    }
  };

  const handleDeleteTrigger = (post: NewsPost) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await newsApi.delete((postToDelete._id || postToDelete.id)!);
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
      refetch();
    } catch {
      alert("Failed to delete the post.");
    }
  };

  const handleOpenPreview = (post: NewsPost) => {
    setSelectedPost(post);
    setIsPreviewOpen(true);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border/40 p-4 rounded-2xl shadow-md shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            News & Announcements
            <Megaphone className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-0.5">
            Manage system notices, platform updates, and client community broadcasts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 font-mono text-xs font-bold shadow-sm"
            disabled={isFetching}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/95 text-white shadow-lg text-xs font-semibold rounded-xl flex items-center gap-1.5 py-2 px-4 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between font-sans text-xs">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Status Filter:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-border/40 bg-muted/20 px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              Total Announcements: <span className="text-foreground font-bold">{total}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Listing Table */}
      <Card className="bg-card/30 border-border/40 backdrop-blur-sm shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground bg-muted/15 text-[9px] uppercase tracking-wider font-mono">
                  <th className="py-3 px-4 font-semibold">Title / Subject</th>
                  <th className="py-3 px-4 font-semibold">Image</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Published At</th>
                  <th className="py-3 px-4 font-semibold">Created At</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground/60 italic font-mono animate-pulse">
                      Querying announcements database...
                    </td>
                  </tr>
                ) : newsPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground italic font-mono">
                      No announcements found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  newsPosts.map((post) => (
                    <tr key={post._id || post.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <p className="font-bold text-foreground truncate">{post.title}</p>
                        <p className="text-muted-foreground text-[11px] truncate mt-0.5">{post.subject}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {post.imageUrl ? (
                          <div className="w-12 h-8 rounded overflow-hidden border border-border/30 bg-black/20 shrink-0">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono italic">No image</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          className={cn(
                            "font-mono text-[9px] px-1.5 py-0.2 border uppercase",
                            post.status === "published"
                              ? "text-emerald-400 border-emerald-400/20 bg-emerald-500/10"
                              : post.status === "draft"
                                ? "text-slate-400 border-border bg-muted/20"
                                : "text-amber-400 border-amber-400/20 bg-amber-500/10"
                          )}
                        >
                          {post.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground/80">
                        {formatDate(post.publishedAt)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground/80">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(post)}
                            title="Preview Announcement"
                            className="p-1.5 hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {post.status === "draft" && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(post)}
                                title="Edit Notice"
                                className="p-1.5 hover:bg-muted/50 rounded-lg text-sky-450 hover:text-sky-400 transition-colors"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePublish(post)}
                                title="Publish Now"
                                className="p-1.5 hover:bg-muted/50 rounded-lg text-emerald-450 hover:text-emerald-400 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {post.status === "published" && (
                            <button
                              onClick={() => handleArchive(post)}
                              title="Archive Notice"
                              className="p-1.5 hover:bg-muted/50 rounded-lg text-amber-450 hover:text-amber-400 transition-colors"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {post.status === "archived" && (
                            <button
                              onClick={() => handlePublish(post)}
                              title="Republish"
                              className="p-1.5 hover:bg-muted/50 rounded-lg text-emerald-450 hover:text-emerald-400 transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteTrigger(post)}
                            title="Delete Announcement"
                            className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 font-mono text-[10px] text-muted-foreground font-bold">
              <p>
                Showing {newsPosts.length} of {total} announcements
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 w-7 p-0 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 w-7 p-0 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE & EDIT DIALOG MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border/20 flex items-center justify-between shrink-0 bg-muted/10">
                <div className="flex items-center gap-2">
                  {selectedPost ? (
                    <FileEdit className="w-4 h-4 text-primary" />
                  ) : (
                    <Plus className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-bold text-sm text-foreground">
                    {selectedPost ? "Edit Announcement" : "Create Announcement"}
                  </span>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-455 text-xs font-semibold flex items-center gap-2 font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Title
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {title.length}/150
                    </span>
                  </div>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., System Update — v2.4.0 Live"
                    maxLength={150}
                    className="bg-muted/30 border-border/40 text-xs rounded-xl"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Subject (Brief Summary)
                    </label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {subject.length}/250
                    </span>
                  </div>
                  <Input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description showing on cards"
                    maxLength={250}
                    className="bg-muted/30 border-border/40 text-xs rounded-xl"
                  />
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Detailed Content
                  </label>
                  <textarea
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Write detailed announcements here. Plain text only. HTML will be sanitized."
                    rows={6}
                    className="flex w-full rounded-xl border border-border/40 bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-sans"
                  />
                </div>

                {/* Image Upload section */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                    Announcement Banner (Optional — Max 5MB)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/png, image/jpeg, image/webp"
                  />

                  {imageUrl ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border/40 bg-black/40 flex items-center justify-center group">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors border border-white/10"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="h-20 w-full rounded-xl border-dashed border-border/60 hover:border-primary/60 bg-muted/10 font-mono text-[10px] text-muted-foreground flex flex-col items-center justify-center gap-1 cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span>Uploading image banner...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-muted-foreground/60" />
                          <span>Click to Upload Banner Image (JPEG, PNG, WebP)</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs font-semibold rounded-xl h-9"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !title.trim() || !subject.trim() || !details.trim()}
                    className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl h-9 px-4 shadow-md flex items-center gap-1"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {selectedPost ? "Save Changes" : "Create Draft"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW DIALOG MODAL */}
      <AnimatePresence>
        {isPreviewOpen && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border/20 flex items-center justify-between shrink-0 bg-muted/10">
                <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Announcement Preview
                </span>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedPost.imageUrl && (
                  <div className="w-full h-48 rounded-xl overflow-hidden border border-border/30 bg-black/20">
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedPost.title}</h2>
                  <p className="text-xs text-primary font-semibold mt-1">{selectedPost.subject}</p>
                </div>

                <div className="border-t border-border/20 pt-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                  {selectedPost.details}
                </div>

                <div className="border-t border-border/10 pt-4 flex flex-wrap gap-4 text-[10px] font-mono text-muted-foreground">
                  <div>
                    Status:{" "}
                    <span className="text-foreground font-bold capitalize">{selectedPost.status}</span>
                  </div>
                  {selectedPost.publishedAt && (
                    <div>
                      Published: <span className="text-foreground">{formatDate(selectedPost.publishedAt)}</span>
                    </div>
                  )}
                  <div>
                    Created: <span className="text-foreground">{formatDate(selectedPost.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Preview Footer */}
              <div className="p-4 border-t border-border/20 bg-muted/5 flex justify-end shrink-0">
                <Button
                  onClick={() => setIsPreviewOpen(false)}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl h-9 px-6"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && postToDelete && (
        <ConfirmModal
          title="Confirm Delete"
          description={`Are you sure you want to permanently delete the announcement "${postToDelete.title}"? This will also clean up its banner image from storage. This action cannot be undone.`}
          confirmLabel="Delete"
          danger={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setPostToDelete(null);
          }}
        />
      )}
    </div>
  );
}
