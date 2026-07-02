import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowLeft, Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/Atoms/card";
import { Button } from "../Components/Atoms/button";

interface Term {
  term: string;
  definition: string;
  category: "Trading" | "System" | "Risk";
  extended: string;
}

const GLOSSARY_TERMS: Term[] = [
  {
    term: "Grid Trading",
    definition: "An algorithmic trading strategy where buy and sell orders are placed at regular, incremental intervals in a set range to capture fluctuations.",
    category: "Trading",
    extended: "Grid bots place buy orders below the current price and sell orders above it. As the market oscillates, orders are constantly filled and replaced, accumulating incremental USD/USDT profit without predicting market direction."
  },
  {
    term: "Average True Range (ATR)",
    definition: "A technical indicator measuring market volatility by looking at the high-to-low range of an asset over a set period.",
    category: "Risk",
    extended: "In HueBox, ATR is calculated on real-time intervals. If volatility expands, the bot widens the spacing between grids to prevent premature order fills. If volatility contracts, grids are placed tighter to optimize capital velocity."
  },
  {
    term: "Trading Balance",
    definition: "The total allocated capital currently available for your bot instances to execute grid strategies.",
    category: "System",
    extended: "HueBox utilizes high-efficiency margin accounts internally to run your strategies. This guarantees that your trading balance is utilized correctly according to your selected bot exposure setting."
  },
  {
    term: "Take-Profit (TP)",
    definition: "A trigger order designed to close a position or deactivate a bot once a specific target profit percentage or price is reached.",
    category: "Trading",
    extended: "Realized grid gains accumulate on each individual grid line fill. In addition, you can set a global take-profit trigger on the overall bot instance to freeze and close all positions when the cumulative return target is hit."
  },
  {
    term: "Trading Account",
    definition: "An isolated, segregated account managed by HueBox on your behalf to run trading bot strategies securely without pooling capital.",
    category: "System",
    extended: "For maximum safety, HueBox assigns a dedicated, isolated trading environment for each bot instance. This isolation ensures that your allocated assets remain secure and independent from any other platform activities."
  },
  {
    term: "Slippage",
    definition: "The difference between the expected price of a trade and the actual price at which the trade is executed, often occurring in high volatility.",
    category: "Trading",
    extended: "Slippage typically happens during fast-moving markets or low liquidity. HueBox implements strict slippage protection parameters within its exchange connectivity layer, canceling or delaying orders if execution prices deviate significantly from target grids."
  },
  {
    term: "Capital Recycling",
    definition: "The proprietary engine capability of compounding bot returns by automatically reinvesting realized trading profits into active grids.",
    category: "System",
    extended: "Instead of letting realized trading returns sit idle, HueBox compound-allocates these returns, allowing your active trading lines to hold larger size or extend grid spacing without requiring manual intervention or deposits."
  },
  {
    term: "Liquidation Price",
    definition: "The price at which automated derivative/futures positions are closed to prevent a margin account from falling below maintenance requirements.",
    category: "Risk",
    extended: "To protect user capital, HueBox calculates the estimated liquidation price and automatically inserts safety margins (safety stop losses) well above the liquidation threshold to avoid asset liquidations."
  }
];

export function Glossary() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTerms = GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.extended.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground cursor-pointer">
          <Link to="/academy" className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Academy
          </Link>
        </Button>
      </div>

      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase">Reference Library</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
          Trading Glossary
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed font-sans">
          A dictionary of essential trading, algorithmic, and safety terms used within the HueBox ecosystem.
        </p>
      </section>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search glossary terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-card/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground transition-colors"
        />
      </div>

      {/* Terms Grid */}
      <div className="space-y-6">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item, idx) => (
            <Card key={idx} className="border border-border/30 bg-card/25">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-mono text-foreground font-bold">
                  {item.term}
                </CardTitle>
                <span className="text-[10px] font-mono font-bold tracking-widest text-primary/80 uppercase px-2 py-0.5 rounded border border-primary/20 bg-primary/5">
                  {item.category}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 font-sans">
                <p className="text-sm font-semibold text-foreground/90">
                  {item.definition}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border/60 pl-3">
                  {item.extended}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No terms found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
