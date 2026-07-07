import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Calendar,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { newsApi } from "../Services/newsApi";
import { Card, CardContent } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { cn } from "../Helpers/utils";

interface PublishedNewsPost {
  id?: string;
  _id?: string;
  title: string;
  subject: string;
  details: string;
  imageUrl?: string;
  publishedAt?: string;
}

export function News() {
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<PublishedNewsPost | null>(null);

  // Fetch published news list
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["published-news", page],
    queryFn: () => newsApi.listPublished({ page, limit: 9 }),
    placeholderData: (prev) => prev,
  });

  const newsPosts: PublishedNewsPost[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto px-1">
      {/* Feed Header */}
      <div className="flex items-center justify-between bg-card border border-border/40 p-4 rounded-2xl shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            News & Announcements
            <Megaphone className="w-5 h-5 text-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-0.5">
            Stay updated with latest feature releases, performance reports, and maintenance notices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 font-mono text-xs font-bold shadow-sm h-9 px-3 shrink-0"
          disabled={isFetching}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Main Feed Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, idx) => (
            <Card key={idx} className="bg-card/25 border-border/30 animate-pulse overflow-hidden h-[340px] flex flex-col">
              <div className="h-44 w-full bg-muted/20" />
              <div className="p-4 flex-1 space-y-3">
                <div className="h-4 w-1/4 bg-muted/20 rounded" />
                <div className="h-6 w-3/4 bg-muted/20 rounded" />
                <div className="h-4 w-5/6 bg-muted/20 rounded" />
                <div className="pt-2 h-8 w-24 bg-muted/20 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : newsPosts.length === 0 ? (
        <div className="bg-card/25 border border-border/30 rounded-2xl py-16 px-4 text-center space-y-3">
          <Megaphone className="w-12 h-12 text-muted-foreground/20 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No Announcements Yet</p>
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-normal">
            There are no updates posted on the feed right now. Check back soon for announcements.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsPosts.map((post) => (
              <motion.div
                key={post.id || post._id}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card
                  onClick={() => setSelectedPost(post)}
                  className="bg-card/30 hover:bg-card/50 border-border/40 hover:border-primary/30 transition-all cursor-pointer overflow-hidden shadow-sm flex flex-col h-[340px] group"
                >
                  {/* Banner Image */}
                  <div className="h-44 w-full bg-black/40 overflow-hidden relative border-b border-border/20 shrink-0">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-1.5">
                        <Megaphone className="w-8 h-8" />
                        <span className="text-[10px] font-mono tracking-widest uppercase">HUEBOX NOTICE</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between min-h-0">
                    <div className="space-y-1.5 min-h-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                        <Calendar className="w-3 h-3 text-primary/75" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.subject}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-start">
                      <span className="text-[10px] font-mono font-bold text-primary group-hover:underline flex items-center gap-1">
                        Read Announcement <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4 font-mono text-[10px] text-muted-foreground font-bold select-none">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-xl cursor-pointer flex items-center gap-1 border-border/40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-xl cursor-pointer flex items-center gap-1 border-border/40"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* FULL READ-MORE VIEWER MODAL */}
      <AnimatePresence>
        {selectedPost && (
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
                  Announcement Details
                </span>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
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

                <div className="border-t border-border/10 pt-4 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary/75" />
                  Published Date: {formatDate(selectedPost.publishedAt)}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border/20 bg-muted/5 flex justify-end shrink-0">
                <Button
                  onClick={() => setSelectedPost(null)}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl h-9 px-6 shadow-md"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
