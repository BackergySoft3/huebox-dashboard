import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  ChevronRight,
  GraduationCap,
  Search,
  ArrowRight,
  HelpCircle,
  FileText,
  X
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";
import { Badge } from "../Components/Atoms/badge";
import {
  ACADEMY_ARTICLES,
  LEARNING_PATHS,
  GLOSSARY_TERMS,
  type Article
} from "../Constants/academyContent";

// Simple custom markdown renderer helper for displaying articles inside the dashboard
function ArticleBodyRenderer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 text-foreground/80 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-lg font-bold text-foreground mt-6 mb-2">
              {trimmed.substring(4)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-xl font-bold text-foreground mt-8 mb-3 border-b border-border/40 pb-2">
              {trimmed.substring(3)}
            </h3>
          );
        }
        if (trimmed.startsWith("- ")) {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-1">
              <li>{trimmed.substring(2)}</li>
            </ul>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s/, "");
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-1">
              <li>{content}</li>
            </ol>
          );
        }
        if (trimmed === "") {
          return <div key={idx} className="h-2" />;
        }
        return <p key={idx}>{trimmed}</p>;
      })}
    </div>
  );
}

export function Academy() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [expandedPath, setExpandedPath] = useState<number | null>(null);

  const learningPathsRef = useRef<HTMLDivElement>(null);
  const articlesRef = useRef<HTMLDivElement>(null);

  // Tabs for the article grid
  const categories = [
    "All",
    "Beginner",
    "Intermediate",
    "Advanced",
    "HueBox Basics",
    "Trading",
    "Security"
  ];

  // Filtering logic
  const filteredArticles = ACADEMY_ARTICLES.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === "All") return matchesSearch;
    if (selectedCategory === "Beginner") return article.difficulty === "Beginner" && matchesSearch;
    if (selectedCategory === "Intermediate") return article.difficulty === "Intermediate" && matchesSearch;
    if (selectedCategory === "Advanced") return article.difficulty === "Advanced" && matchesSearch;
    return article.category === selectedCategory && matchesSearch;
  });

  const featuredArticles = ACADEMY_ARTICLES.slice(0, 3);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getDifficultyBadge = (diff: Article["difficulty"]) => {
    switch (diff) {
      case "Beginner":
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Beginner</Badge>;
      case "Intermediate":
        return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">Intermediate</Badge>;
      case "Advanced":
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-rose-500/20">Advanced</Badge>;
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* 1. Hero Section */}
      <section className="text-center py-12 md:py-20 relative overflow-hidden rounded-3xl border border-border/30 bg-card/10 backdrop-blur-sm p-6 sm:p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Trust Strip */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wider uppercase font-mono">
            <span>100% Free</span>
            <span className="text-primary/40">•</span>
            <span>No Login Required</span>
            <span className="text-primary/40">•</span>
            <span>Beginner-Friendly</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground font-heading">
            Understand Trading, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-[#42E2D5] bg-clip-text text-transparent">
              Understand HueBox
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-sans">
            Access masterclass courses and tutorials on blockchain mechanics, grid trading bots, position sizing, and system safety — built entirely for transparent crypto trading education.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto font-semibold cursor-pointer" onClick={() => scrollToRef(learningPathsRef)}>
              Start Learning <GraduationCap className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold cursor-pointer" onClick={() => scrollToRef(articlesRef)}>
              Browse Articles
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Featured Content (Carousel style or grid) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Featured Education
            </h2>
            <p className="text-sm text-muted-foreground">
              Hand-picked essentials to help you master automated trading.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredArticles.map((article) => (
            <Card
              key={article.slug}
              className="flex flex-col overflow-hidden h-full border border-border/40 bg-card/40 hover:bg-card/70 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              onClick={() => setActiveArticle(article)}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  {getDifficultyBadge(article.difficulty)}
                </div>
              </div>
              <CardHeader className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readingTime}
                  </span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {article.excerpt}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 border-t border-border/10 mt-auto">
                <span className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all mt-4">
                  Read Article <ChevronRight className="w-4 h-4" />
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Learning Paths (Structured Tracks) */}
      <section ref={learningPathsRef} className="space-y-6 pt-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Learning Paths
          </h2>
          <p className="text-sm text-muted-foreground">
            Structured tracks designed to take you from trading novice to grid expert.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {LEARNING_PATHS.map((path, idx) => {
            const isExpanded = expandedPath === idx;
            return (
              <Card
                key={idx}
                className={`flex flex-col border border-border/40 bg-card/30 hover:bg-card/50 transition-all duration-300 ${
                  isExpanded ? "ring-1 ring-primary/30" : ""
                }`}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    {getDifficultyBadge(path.difficulty)}
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {path.estimatedTime}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-heading">{path.title}</CardTitle>
                  <CardDescription className="min-h-[48px]">{path.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-between font-semibold cursor-pointer"
                    onClick={() => setExpandedPath(isExpanded ? null : idx)}
                  >
                    <span>{isExpanded ? "Hide Modules" : "View Curriculum"}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                  </Button>

                  {isExpanded && (
                    <div className="space-y-3 pt-3 border-t border-border/20 animate-fade-in">
                      {path.modules.map((mod, modIdx) => (
                        <div key={modIdx} className="flex gap-3 items-start">
                          <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {modIdx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{mod.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{mod.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Categorized & Filterable Articles */}
      <section ref={articlesRef} className="space-y-8 pt-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Browse All Resources
            </h2>
            <p className="text-sm text-muted-foreground">
              Filter by category, difficulty level, or search directly.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
          </div>
        </div>

        {/* Categories Tab Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/20">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 border-border hover:bg-muted hover:border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtered Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card
                key={article.slug}
                className="flex flex-col border border-border/40 bg-card/30 hover:bg-card/60 hover:border-primary/20 transition-all duration-300 group cursor-pointer"
                onClick={() => setActiveArticle(article)}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    {getDifficultyBadge(article.difficulty)}
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {article.readingTime}
                    </span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 border-t border-border/10 mt-auto">
                  <div className="w-full flex items-center justify-between mt-4">
                    <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Read <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No resources found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        )}
      </section>

      {/* 5. Glossary Teaser */}
      <section className="space-y-6 pt-8 border-t border-border/20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Key Trading Terms
            </h2>
            <p className="text-sm text-muted-foreground">
              A quick guide to essential terminology used across our tools and guides.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="font-semibold cursor-pointer">
            <Link to="/glossary">
              View Full Glossary <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GLOSSARY_TERMS.map((term, idx) => (
            <Card key={idx} className="border border-border/30 bg-card/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-mono text-primary font-bold">
                  {term.term}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {term.definition}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Dynamic Article Detail Modal Overlay */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header image banner */}
            <div className="relative h-48 sm:h-64 w-full bg-muted overflow-hidden shrink-0">
              <img
                src={activeArticle.thumbnailUrl}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background border border-border text-foreground hover:scale-105 transition-all cursor-pointer"
                aria-label="Close article"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  {getDifficultyBadge(activeArticle.difficulty)}
                  <Badge variant="outline" className="bg-background/80 text-[10px] font-mono">
                    {activeArticle.category}
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-heading tracking-tight leading-tight">
                  {activeArticle.title}
                </h2>
              </div>
            </div>

            {/* Scrollable body content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-4">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Free Educational Resource
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {activeArticle.readingTime} read
                </span>
              </div>

              <ArticleBodyRenderer text={activeArticle.body} />
            </div>

            {/* Sticky footer action */}
            <div className="border-t border-border/40 p-4 sm:px-8 bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground font-mono">
                HueBox Academy • Educational Only
              </span>
              <Button size="sm" onClick={() => setActiveArticle(null)} className="cursor-pointer">
                Close Reading
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
