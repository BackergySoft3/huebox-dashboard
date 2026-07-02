import { useState, useEffect, useRef } from "react";
import { ChevronDown, FileText, Printer, HelpCircle } from "lucide-react";
import { Button } from "../Components/Atoms/button";

interface Section {
  id: string;
  num: number;
  title: string;
  content: string;
}

const LAST_UPDATED_DATE = "July 2, 2026";

const SECTIONS: Section[] = [
  {
    id: "intro",
    num: 1,
    title: "Introduction & Acceptance of Terms",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nBy accessing or using the website, interface, or automated tools provided by HueBox (collectively, the 'Service'), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must immediately cease all access and use of the Service."
  },
  {
    id: "eligibility",
    num: 2,
    title: "Eligibility",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nYou must be at least 18 years of age, or the age of majority in your jurisdiction, to register for an account or use our services. By using our platform, you warrant that you are not a citizen, resident, or organized under the laws of any restricted jurisdiction (e.g., sanctioned countries or jurisdictions where cryptocurrency trading is prohibited by law)."
  },
  {
    id: "description",
    num: 3,
    title: "Description of Service",
    content: "HueBox provides automated grid-trading bot software infrastructure. The Service does not directly custody user funds. All trading capital is managed within an isolated trading account allocated to you and traded on licensed/regulated exchange infrastructure, subject to their security protocols. Users retain ultimate oversight and access to their allocated balance at all times.\n\nHueBox's software operates solely as an execution layer, executing trading commands in accordance with user-configured parameters and AI model profiles (Moderate, Balanced, Aggressive)."
  },
  {
    id: "no-advice",
    num: 4,
    title: "No Financial Advice",
    content: "All content, tutorials, articles, guides, and indicators provided by HueBox (including but not limited to the HueBox Academy, bot performance metrics, and glossary terms) are for informational and educational purposes only. Nothing on the site or within the software interface constitutes financial, investment, legal, or tax advice. You should consult a qualified financial professional before engaging in cryptocurrency trading."
  },
  {
    id: "risk",
    num: 5,
    title: "Risk Disclosure",
    content: "Cryptocurrency, derivative, and futures trading carries a substantial risk of loss and is not suitable for every investor. Automated or algorithmic trading strategies, including grid-trading, do not guarantee profits and may result in the complete loss of your allocated capital. Past performance metrics, simulated results, or historical trades displayed on the platform are illustrative only and are not indicative of future performance."
  },
  {
    id: "registration",
    num: 6,
    title: "Account Registration & KYC Requirements",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nTo access certain features of the platform, you must register for an account and complete our profile setup, which may include verifying your identity (Know Your Customer / KYC). You agree to provide accurate, current, and complete information during registration and keep your credentials secure."
  },
  {
    id: "fees",
    num: 7,
    title: "Fees & Payments",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nHueBox may charge fees for software access, usage tiers, or individual bot instances. Deposits, payments, and subscription charges may be facilitated through third-party fiat gateways (such as MoonPay, Transak, Mercuryo, or Ramp). Withdrawals are subject to exchange constraints. All fees are clearly disclosed in the billing interface prior to bot deployment."
  },
  {
    id: "responsibilities",
    num: 8,
    title: "User Responsibilities",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nYou are solely responsible for securing your login credentials, safeguarding your API keys, configuring appropriate permissions (e.g., disabling withdrawal privileges on API keys), and complying with all local tax and regulatory requirements associated with your trading activities."
  },
  {
    id: "rights",
    num: 9,
    title: "Platform Rights",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nHueBox reserves the right to suspend or terminate accounts, deactivate or force-stop bot instances, and pause broadcast signals at any time in its sole discretion for safety, compliance, or maintenance purposes."
  },
  {
    id: "limitation",
    num: 10,
    title: "Limitation of Liability",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nTo the maximum extent permitted by law, HueBox and its affiliates, officers, and employees shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of the software, third-party outages, exchange liquidations, or API communication errors."
  },
  {
    id: "ip",
    num: 11,
    title: "Intellectual Property",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nAll software, algorithms, designs, brand marks, logos, and educational materials (including Academy content) are the exclusive intellectual property of HueBox. No license is granted to reverse engineer, copy, or redistribute any portion of our codebase."
  },
  {
    id: "third-party",
    num: 12,
    title: "Third-Party Services",
    content: "The Service relies on integrations with third-party platforms (including regulated third-party exchange infrastructure, payment processors like MoonPay, Transak, Mercuryo, or Ramp, and AI/LLM components). HueBox is not responsible for, and disclaims all liability regarding, any third-party service outages, network congestion, api alterations, or errors committed by third-party providers."
  },
  {
    id: "privacy",
    num: 13,
    title: "Privacy & Data Handling",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nYour privacy is important to us. Please refer to our separate Privacy Policy (if available) to understand how we collect, store, and process your personal details and exchange metrics."
  },
  {
    id: "law",
    num: 14,
    title: "Governing Law & Dispute Resolution",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nThese Terms and Conditions shall be governed by and construed in accordance with the laws of our operating jurisdiction, without regard to conflict of law principles. Any dispute arising out of these terms shall be settled exclusively through binding arbitration."
  },
  {
    id: "changes",
    num: 15,
    title: "Changes to These Terms",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nWe reserve the right to modify these Terms and Conditions at any time. When changes are made, we will update the 'Last updated' date at the top of the page. Continued use of the platform constitutes acceptance of the updated terms."
  },
  {
    id: "contact",
    num: 16,
    title: "Contact Information",
    content: "[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]\n\nIf you have any questions, feedback, or concerns regarding these Terms and Conditions, please contact us at support@huebox.dev.com or submit a ticket via the dashboard help center."
  }
];

export function Terms() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const sectionsRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Monitor scroll to highlight active TOC item
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // offset for sticky header

      for (const section of SECTIONS) {
        const el = sectionsRefs.current[section.id];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTocClick = (id: string) => {
    const el = sectionsRefs.current[id];
    if (el) {
      const top = el.offsetTop - 90; // offset for navbar
      window.scrollTo({ top, behavior: "smooth" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 print:p-0 print:bg-white print:text-black">
      
      {/* Page Header */}
      <section className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 print:border-none print:pb-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary print:hidden">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading print:text-3xl print:text-black">
            Terms & Conditions
          </h1>
          <p className="text-sm text-muted-foreground font-mono print:text-xs print:text-black">
            Last updated: <span className="text-foreground font-semibold print:font-bold">{LAST_UPDATED_DATE}</span>
          </p>
        </div>

        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="print:hidden w-fit font-semibold cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Document
        </Button>
      </section>

      {/* Main layout: Sidebar TOC + Section Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative print:block">
        
        {/* Mobile Floating/Sticky TOC Panel */}
        <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur-md border border-border/40 rounded-xl p-3 shadow-md print:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground px-2 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Table of Contents:{" "}
              <span className="text-primary font-mono">
                {SECTIONS.find((s) => s.id === activeSection)?.num}.{" "}
                {SECTIONS.find((s) => s.id === activeSection)?.title}
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {mobileMenuOpen && (
            <div className="mt-3 max-h-[60vh] overflow-y-auto space-y-1.5 border-t border-border/20 pt-3">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleTocClick(sec.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {sec.num}. {sec.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Sticky Table of Contents Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto border border-border/40 bg-card/25 rounded-2xl p-5 space-y-4 print:hidden">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground font-heading">
            Table of Contents
          </h3>
          <nav className="space-y-1" aria-label="Table of contents">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleTocClick(sec.id)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all border border-transparent cursor-pointer flex gap-2 ${
                  activeSection === sec.id
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-border/30"
                }`}
              >
                <span className="font-mono text-[10px] opacity-70 shrink-0">{sec.num}.</span>
                <span className="truncate">{sec.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Section Content Column */}
        <div className="lg:col-span-8 space-y-10 print:space-y-8">
          
          {/* Compliance Alert Box */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-500/90 leading-relaxed flex gap-3 print:hidden">
            <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold uppercase tracking-wider mb-1">Legal Review Required</p>
              <p className="font-sans">
                The content below represents the structuring template for HueBox terms. Sections marked with <span className="font-mono font-bold">[LEGAL TEXT TO BE PROVIDED BY LEGAL COUNSEL]</span> must be populated with binding legal language prior to launching this product to users.
              </p>
            </div>
          </div>

          {/* Render Sections */}
          {SECTIONS.map((sec) => (
            <section
              key={sec.id}
              id={sec.id}
              ref={(el) => {
                sectionsRefs.current[sec.id] = el;
              }}
              className="space-y-3 pt-4 border-t border-border/10 first:border-none first:pt-0 scroll-mt-24 print:border-t print:border-black/20 print:pt-4"
            >
              <h2 className="text-xl font-bold tracking-tight text-foreground font-heading flex gap-2 items-center print:text-lg print:text-black">
                <span className="text-primary font-mono text-base print:text-black">{sec.num}.</span>
                {sec.title}
              </h2>
              <div className="text-sm text-foreground/80 leading-relaxed font-sans whitespace-pre-wrap pl-6 print:pl-0 print:text-xs print:text-black">
                {sec.content}
              </div>
            </section>
          ))}
        </div>

      </div>

    </div>
  );
}
