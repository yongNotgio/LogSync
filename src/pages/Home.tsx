import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { GitHubLogin } from "@/components/auth/GitHubLogin";
import { ThreeBackground } from "@/components/common/ThreeBackground";
import { animate, stagger } from "animejs";
import homeImg from "@/assets/home.png";

function FeatIconLink() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function FeatIconAI() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>; }
function FeatIconClock() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function FeatIconEdit() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function FeatIconSave() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function FeatIconLock() { return <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }

const features: { icon: ReactNode; title: string; desc: string }[] = [
  { icon: <FeatIconLink />, title: "GitHub Integration", desc: "Automatically pull commits, diffs, and activity from your repositories." },
  { icon: <FeatIconAI />, title: "AI Enhancement", desc: "Transform casual commit messages into professional, HR-ready descriptions." },
  { icon: <FeatIconClock />, title: "8-to-5 Schedule", desc: "Map all activities to a standard workday, regardless of actual commit times." },
  { icon: <FeatIconEdit />, title: "Inline Editing", desc: "Fine-tune AI-generated content with an intuitive editing interface." },
  { icon: <FeatIconSave />, title: "Auto-Save", desc: "Never lose your work with real-time persistence powered by Convex." },
  { icon: <FeatIconLock />, title: "Finalize & Lock", desc: "Lock completed journals to prevent accidental changes." },
];

const steps = [
  { n: "1", title: "Connect GitHub", desc: "Sign in with your GitHub account to grant access to your repositories." },
  { n: "2", title: "Fetch Commits", desc: "We pull your commits and diffs for the selected date." },
  { n: "3", title: "AI Generation", desc: "Gemini AI creates professional time blocks covering 8AM to 5PM." },
  { n: "4", title: "Review & Finalize", desc: "Edit as needed, then finalize your journal for the day." },
];

export function Home() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Helper: observe a container and fire anime when it enters viewport
  const observeSection = useCallback(
    (
      ref: React.RefObject<HTMLElement | null>,
      animateFn: (el: HTMLElement) => void
    ) => {
      if (!ref.current) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animateFn(entry.target as HTMLElement);
            observer.disconnect();
          }
        },
        { threshold: 0.12 }
      );
      observer.observe(ref.current);
      return observer;
    },
    []
  );

  useEffect(() => {
    // Badge pop-in (immediate on mount)
    if (badgeRef.current) {
      animate(badgeRef.current, {
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        ease: "outBack",
        delay: 200,
      });
    }

    // Hero — fires on mount (already in view)
    if (heroRef.current) {
      const els = heroRef.current.querySelectorAll(".hero-anim");
      animate(els, {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 900,
        ease: "outExpo",
        delay: stagger(130, { start: 300 }),
      });
    }

    // Features — scroll-triggered
    const featObs = observeSection(featuresRef, (el) => {
      const cards = el.querySelectorAll(".feature-card");
      animate(cards, {
        translateY: [60, 0],
        opacity: [0, 1],
        duration: 750,
        ease: "outExpo",
        delay: stagger(90, { start: 60 }),
      });
    });

    // Steps — scroll-triggered
    const stepsObs = observeSection(stepsRef, (el) => {
      const stepEls = el.querySelectorAll(".step-item");
      animate(stepEls, {
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 750,
        ease: "outExpo",
        delay: stagger(130, { start: 60 }),
      });
    });

    // CTA — scroll-triggered fade + rise
    const ctaObs = observeSection(ctaRef, (el) => {
      animate(el, {
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 800,
        ease: "outExpo",
      });
    });

    return () => {
      featObs?.disconnect();
      stepsObs?.disconnect();
      ctaObs?.disconnect();
    };
  }, [observeSection]);

  // Card hover animation helper
  const handleCardEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      translateY: -8,
      scale: 1.03,
      boxShadow: ["0 4px 24px rgba(2,132,199,0.13), 0 1.5px 6px rgba(99,102,241,0.08)", "0 20px 48px rgba(2,132,199,0.22), 0 4px 16px rgba(99,102,241,0.12)"],
      duration: 300,
      ease: "outExpo",
    });
  };
  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    animate(e.currentTarget, {
      translateY: 0,
      scale: 1,
      boxShadow: "0 4px 24px rgba(2,132,199,0.13), 0 1.5px 6px rgba(99,102,241,0.08)",
      duration: 400,
      ease: "outExpo",
    });
  };

  return (
    <div className="relative bg-white min-h-screen overflow-hidden">
      {/* Animated 3-D wireframe background */}
      <div className="absolute inset-0 opacity-30">
        <ThreeBackground />
      </div>

      {/* Soft radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(14,165,233,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-4 pb-16">
        {/* ── Hero ── */}
        <div ref={heroRef} className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
          {/* Left: Text */}
          <div className="flex-1 text-left">
            <span
              ref={badgeRef}
              className="hero-anim inline-flex items-center gap-2 mb-6 rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-700 border border-sky-200/60 px-4 py-1.5 text-sm font-semibold tracking-wide opacity-0 shadow-sm"
              style={{ transformOrigin: "center" }}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.26L4 10l5.91-1.74z"/></svg>
              Powered by Gemini AI &amp; GitHub
            </span>

            <h1 className="hero-anim text-5xl font-extrabold tracking-tight text-sky-900 sm:text-6xl leading-tight opacity-0">
              Automate Your{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  Internship Journal
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full opacity-60" />
              </span>
            </h1>

            <p className="hero-anim mt-6 text-lg leading-8 text-slate-500 max-w-xl opacity-0">
              LogSync AI transforms your GitHub commits into professional daily work journals.
              Map your coding activity to a standard 9-to-5 schedule with AI-powered descriptions.
            </p>

            <div className="hero-anim mt-10 flex flex-wrap items-center gap-4 opacity-0">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-8 py-3.5 text-white font-semibold text-base shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-105 transition-all duration-200"
                >
                  Go to Dashboard →
                </Link>
              ) : (
                <GitHubLogin />
              )}
              <a
                href="#features"
                className="inline-flex items-center gap-1.5 text-sky-600 font-medium hover:text-indigo-600 transition-colors group"
              >
                Learn more
                <span className="group-hover:translate-y-0.5 transition-transform inline-block">↓</span>
              </a>
            </div>

          </div>

          {/* Right: home illustration */}
          <div className="hero-anim flex-1 flex justify-center opacity-0 relative">
            {/* Glow blob behind image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full bg-gradient-to-br from-sky-300/40 to-indigo-400/40 blur-3xl" />
            </div>
            {/* Drop shadow layer */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-sky-400/20 blur-2xl rounded-full" />
            <img
              src={homeImg}
              alt="LogSync illustration"
              className="relative w-full max-w-sm select-none drop-shadow-[0_24px_48px_rgba(2,132,199,0.25)]"
              draggable={false}
            />
          </div>
        </div>

        {/* ── Features ── */}
        <div id="features" className="mt-32">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-sky-500 mb-3 bg-sky-50 border border-sky-100 px-4 py-1 rounded-full">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-sky-900 mb-3">
              Everything You Need
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From raw commits to polished reports — all in one place.
            </p>
          </div>

          <div
            ref={featuresRef}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="feature-card group relative rounded-2xl bg-white backdrop-blur border border-sky-100/80 p-6 cursor-default opacity-0 overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(2,132,199,0.13), 0 1.5px 6px rgba(99,102,241,0.08)" }}
                onMouseEnter={handleCardEnter}
                onMouseLeave={handleCardLeave}
              >
                {/* Gradient accent bar top */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-indigo-50/0 group-hover:from-sky-50/60 group-hover:to-indigo-50/60 transition-all duration-300 rounded-2xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mb-4 shadow-sm">
                    {icon}
                  </div>
                  <h3 className="font-bold text-sky-900 text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="mt-32">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase text-indigo-500 mb-3 bg-indigo-50 border border-indigo-100 px-4 py-1 rounded-full">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-sky-900 mb-3">
              Four Simple Steps
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Turn commits into a complete daily log in minutes.
            </p>
          </div>

          <div ref={stepsRef} className="grid gap-8 md:grid-cols-4 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-sky-200 via-indigo-300 to-sky-200" />
            {steps.map(({ n, title, desc }) => (
              <div
                key={n}
                className="step-item text-center opacity-0 relative"
                onMouseEnter={(e) =>
                  animate(e.currentTarget.querySelector(".step-bubble")!, {
                    scale: [1, 1.18, 1],
                    rotate: [0, -8, 0],
                    duration: 600,
                    ease: "outElastic(1,.5)",
                  })
                }
              >
                <div className="step-bubble w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white flex items-center justify-center mx-auto mb-5 text-xl font-extrabold shadow-lg shadow-sky-200 relative z-10">
                  {n}
                </div>
                <h3 className="font-bold text-sky-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-32 mb-8">
          <div ref={ctaRef} className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 p-px shadow-2xl shadow-sky-300/40 opacity-0">
            <div className="relative rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 px-8 py-14 text-center overflow-hidden">
              {/* Decorative blobs */}
              <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-indigo-300/20 blur-2xl pointer-events-none" />
              <div className="relative">
                <span className="inline-block text-xs font-bold tracking-widest uppercase text-sky-200 mb-4 bg-white/10 border border-white/20 px-4 py-1 rounded-full">
                  Get Started Free
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                  Ready to automate your journal?
                </h2>
                <p className="text-sky-100 mb-8 max-w-md mx-auto">
                  Sign in with GitHub and generate your first report in seconds.
                </p>
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-sky-700 px-8 py-3.5 font-bold text-base shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
                  >
                    Open Dashboard →
                  </Link>
                ) : (
                  <GitHubLogin variant="light" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
