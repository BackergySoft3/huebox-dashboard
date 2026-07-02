// CONTENT STYLE RULE:
// Never reference Bybit, sub-accounts, exchange API keys, or exchange-side account mechanics in user-facing copy.
// HueBox manages all exchange relationships internally; users only see their HueBox trading account and balance.

export interface Article {
  title: string;
  slug: string;
  excerpt: string;
  readingTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: "Trading" | "HueBox Basics" | "Security" | "Blockchain";
  thumbnailUrl: string;
  body: string;
}

export interface LearningModule {
  title: string;
  description: string;
}

export interface LearningPath {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  modules: LearningModule[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const ACADEMY_ARTICLES: Article[] = [
  {
    title: "What Is Grid Trading?",
    slug: "what-is-grid-trading",
    excerpt: "Learn the core concepts of grid trading bots: buy low, sell high, and accumulate profits automatically within a defined price range.",
    readingTime: "5 min",
    difficulty: "Beginner",
    category: "Trading",
    thumbnailUrl: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=60",
    body: `Grid trading is a systematic trading strategy that automates buying and selling digital assets. By placing a series of buy and sell orders at regular intervals above and below a predefined base price, it creates a "grid" of orders.

### How It Works
When the price of an asset drops, the bot executes buy orders. When the price rises, it executes corresponding sell orders. This allows traders to capitalize on market volatility without needing to predict the exact direction of the market.

1. **Grid Range**: The upper and lower price bounds within which the bot will trade.
2. **Grid Quantity**: The number of buy/sell lines within the range. More lines capture smaller price fluctuations but require smaller order sizes.
3. **Sideways Performance**: Grid trading excels in sideways (ranging) markets, where prices bounce up and down within a stable corridor.`
  },
  {
    title: "How HueBox's AI Engine Manages Risk",
    slug: "huebox-ai-risk-management",
    excerpt: "Discover how the HueBox AI system automatically assesses market volatility to dynamically adjust grids and protect your trading capital.",
    readingTime: "6 min",
    difficulty: "Beginner",
    category: "HueBox Basics",
    thumbnailUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=60",
    body: `HueBox is built from the ground up to prioritize capital preservation. Unlike simple grid bots that place static grids and leave them unattended, the HueBox engine leverages advanced volatility filters and safety buffers.

### Core Risk Controls
- **Volatility Analysis**: HueBox constantly monitors Average True Range (ATR) to adjust grid density. During periods of high volatility, grids are automatically spaced further apart to prevent premature fills.
- **Isolated Trading Accounts**: All trades occur inside isolated trading accounts managed on your behalf. Funds are never pooled with other users, ensuring your assets are strictly segregated.
- **Circuit Breakers**: If the market moves beyond safe bounds, the engine enters a safe-hold state, preventing unnecessary stop-loss triggers while protecting your margin.`
  },
  {
    title: "Understanding ATR and Trailing Grids",
    slug: "understanding-atr-and-trailing-grids",
    excerpt: "Dive deep into technical indicators like Average True Range (ATR) and how trailing grids follow strong market trends dynamically.",
    readingTime: "8 min",
    difficulty: "Advanced",
    category: "Trading",
    thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=60",
    body: `Standard grid bots suffer in strong trending markets because the price can break out of the grid, leaving the trader with a bag of assets (in a downtrend) or having sold too early (in an uptrend). HueBox solves this through dynamic ATR scaling and trailing mechanisms.

### What is ATR?
Average True Range (ATR) is a technical analysis indicator that measures market volatility by decomposing the entire range of an asset price for that period.

### Trailing Grids
A trailing grid automatically shifts its upper and lower bounds as the price moves. If the price rises past the top of the grid, the entire grid moves upward, ensuring you do not miss out on sustained bullish trends while maintaining a safety buffer.`
  },
  {
    title: "How Your HueBox Trading Account Works",
    slug: "trading-accounts-guide",
    excerpt: "Understand how your isolated HueBox trading account keeps your funds segregated and secure while running automated strategies.",
    readingTime: "4 min",
    difficulty: "Beginner",
    category: "Security",
    thumbnailUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?w=600&auto=format&fit=crop&q=60",
    body: `Security is paramount in automated trading. HueBox allocates a dedicated, isolated trading account for each user to secure your trading capital.

### Why Use Isolated Trading Accounts?
1. **Risk Isolation**: Each trading bot instance runs in its own segregated environment. This ensures that the margin allocated to one strategy is strictly separate and cannot be impacted by another.
2. **Custody & Segregation**: Your deposited funds are credited directly to your dedicated trading balance. They are never pooled with other users' capital, maintaining clear ownership and tracking.
3. **Clean Performance Tracking**: Profit and loss (PnL) calculations are completely isolated, making it easy to see exactly how much your HueBox bot is generating.`
  },
  {
    title: "Crypto Security Basics",
    slug: "crypto-security-basics",
    excerpt: "Learn best practices for securing your API keys, managing 2FA, and verifying system access to guarantee your crypto remains safe.",
    readingTime: "5 min",
    difficulty: "Intermediate",
    category: "Security",
    thumbnailUrl: "https://images.unsplash.com/photo-1601597111158-2fceff270190?w=600&auto=format&fit=crop&q=60",
    body: `Security is integrated directly into the HueBox platform. We employ institutional-grade protocols to protect your funds and trade executions.

### Security Architecture
- **No Direct API Exposure**: Users do not need to generate, manage, or provide exchange API keys. All connectivity is handled internally through our secure trading gateways.
- **Encrypted Fund Routing**: All deposits and fund allocations are protected with industry-standard encryption shields.
- **Two-Factor Authentication (2FA)**: Ensure Google Authenticator is active on your HueBox account to prevent unauthorized access.`
  }
];

export const LEARNING_PATHS: LearningPath[] = [
  {
    title: "Beginner: Grid Trading Essentials",
    description: "Perfect for newcomers. Learn the foundations of crypto markets and understand how grid automation makes steady gains.",
    estimatedTime: "15 mins",
    difficulty: "Beginner",
    modules: [
      {
        title: "Introduction to Cryptocurrency Markets",
        description: "Understanding market order books, bid-ask spreads, and the nature of crypto volatility."
      },
      {
        title: "The Mechanics of a Grid Bot",
        description: "How buying the dips and selling the rips automatically builds a grid profile."
      },
      {
        title: "Activating Your First Bot",
        description: "Allocating funds and launching your first automated strategy."
      }
    ]
  },
  {
    title: "Intermediate: Risk & Range Optimization",
    description: "Learn how to assess market conditions and size your positions to protect your capital from trend breakouts.",
    estimatedTime: "20 mins",
    difficulty: "Intermediate",
    modules: [
      {
        title: "Identifying Market Regimes",
        description: "Distinguishing between ranging (sideways) and trending markets using technical indicators."
      },
      {
        title: "Position Sizing & Margin Budgets",
        description: "Calculating maximum exposure per grid to ensure you never face liquidation."
      },
      {
        title: "Stop-Loss and Take-Profit Settings",
        description: "Configuring safety parameters that automatically shut down trading when ranges are violated."
      }
    ]
  },
  {
    title: "HueBox Deep Dive: Advanced Bot Mechanics",
    description: "Explore the proprietary HueBox architecture, including account recycling and bot personality tuning.",
    estimatedTime: "22 mins",
    difficulty: "Advanced",
    modules: [
      {
        title: "Trading Account Architecture",
        description: "How HueBox isolates margin, prevents cross-strategy exposure, and uses multi-instance setups."
      },
      {
        title: "Bot Personality Profiles",
        description: "Deep dive into the math behind Moderate, Balanced, and Aggressive profiles."
      },
      {
        title: "Capital Recycling & Compound Interest",
        description: "How realized grid gains are instantly recycled into fresh margin for higher efficiency."
      }
    ]
  }
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Grid Trading",
    definition: "An algorithmic strategy where buy and sell orders are placed at regular, incremental intervals in a set range to capture fluctuations."
  },
  {
    term: "Average True Range (ATR)",
    definition: "A technical indicator measuring market volatility by looking at the high-to-low range of an asset over a set period."
  },
  {
    term: "Trading Balance",
    definition: "The total allocated capital currently available for your bot instances to execute grid strategies."
  },
  {
    term: "Take-Profit",
    definition: "A trigger order designed to close a position or deactivate a bot once a specific target profit percentage or price is reached."
  },
  {
    term: "Trading Account",
    definition: "An isolated, segregated account managed by HueBox on your behalf to run trading bot strategies securely without pooling capital."
  },
  {
    term: "Slippage",
    definition: "The difference between the expected price of a trade and the actual price at which the trade is executed, often occurring in high volatility."
  }
];
