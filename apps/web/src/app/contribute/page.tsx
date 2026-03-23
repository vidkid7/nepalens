"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ───────────────────────── Data ───────────────────────── */

const BENEFITS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Reach Millions",
    description: "Your work gets seen by creators, designers, and businesses across the globe every single day.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    ),
    title: "Build Your Portfolio",
    description: "Showcase your best work with a beautiful public profile. Track views, downloads, and engagement.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-5.388c.003.046.003.093.003.14 0 .85-.176 1.66-.494 2.397" />
      </svg>
    ),
    title: "Join Challenges",
    description: "Compete in themed photo challenges, gain exposure, and push your creative boundaries.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "Free Forever",
    description: "No fees, no commissions, no catch. NepaLens is free for contributors and users alike.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with email or Google. It's completely free.",
  },
  {
    number: "02",
    title: "Review the Guidelines",
    description: "Familiarize yourself with our quality standards to ensure your work shines.",
  },
  {
    number: "03",
    title: "Upload Your Best Work",
    description: "Add titles, tags, and descriptions so people can discover your photos and videos.",
  },
  {
    number: "04",
    title: "Get Discovered",
    description: "Your content appears in search results, curated feeds, and collections worldwide.",
  },
];

const FAQS = [
  {
    question: "Is it really free to contribute?",
    answer:
      "Yes — completely free. There are no sign-up fees, no commissions, and no hidden costs. NepaLens is a free platform for everyone.",
  },
  {
    question: "Who can use my photos and videos?",
    answer:
      "Content on NepaLens is available under a free-to-use license. Anyone can download and use your work for personal or commercial projects without attribution, though credits are always appreciated.",
  },
  {
    question: "Do I keep the copyright to my work?",
    answer:
      "Absolutely. You retain full copyright to everything you upload. You're granting a non-exclusive license for others to use your content, but you remain the owner and can continue licensing your work elsewhere.",
  },
  {
    question: "What kind of content can I upload?",
    answer:
      "We accept high-quality photos (JPEG, PNG, WebP — minimum 4 megapixels) and videos (MP4, minimum 720p, 5–60 seconds). All content must be original work that you own the rights to.",
  },
  {
    question: "How long does it take for my uploads to appear?",
    answer:
      "Most uploads are processed and published within a few minutes. In rare cases, content may be held for a brief manual review to ensure it meets our quality guidelines.",
  },
  {
    question: "Can I remove my content later?",
    answer:
      "Yes. You can delete any of your uploads at any time from your dashboard. Deleted content is removed from search results and can no longer be downloaded.",
  },
];

/* ──────────────────────── Icons ───────────────────────── */

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

/* ──────────────────────── Component ──────────────────── */

export default function ContributePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const isContributor = isLoggedIn && (session.user as any).isContributor === true;

  const handleApply = async () => {
    setApplying(true);
    setApplyError("");

    try {
      const res = await fetch("/api/internal/contributor/apply", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setApplyError(data.error || "Something went wrong");
        setApplying(false);
        return;
      }

      router.push("/upload");
      router.refresh();
    } catch {
      setApplyError("Network error — please try again.");
      setApplying(false);
    }
  };

  /* ── Hero Section ── */
  const hero = (
    <section className="relative overflow-hidden bg-surface-950 text-white">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-brand/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(5,160,129,0.15),_transparent_60%)]" />

      <div className="relative container-app py-24 sm:py-32 lg:py-40 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-caption text-white/80 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse-soft" />
          Open to all creators
        </div>

        <h1 className="text-hero-sm sm:text-hero max-w-3xl mx-auto">
          Share Your Art With&nbsp;the&nbsp;World
        </h1>

        <p className="text-body sm:text-subtitle text-white/70 max-w-2xl mx-auto mt-6 leading-relaxed">
          Join thousands of photographers and videographers who share their
          work on NepaLens — the free stock media platform built for creators.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <CTAButton
            isLoggedIn={isLoggedIn}
            isContributor={isContributor}
            applying={applying}
            onApply={handleApply}
            variant="primary"
          />
          <a href="#how-it-works" className="btn btn-md text-white/80 hover:text-white transition-colors">
            Learn more
            <ChevronDownIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );

  /* ── Benefits Section ── */
  const benefits = (
    <section className="py-20 sm:py-28 bg-surface-50">
      <div className="container-app">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-display text-surface-900">Why Contribute?</h2>
          <p className="text-body text-surface-500 mt-3">
            Whether you&apos;re a hobbyist or a professional, NepaLens gives your
            work the audience it deserves.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="card p-6 hover:shadow-card-hover hover:border-surface-300 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand flex items-center justify-center mb-4">
                {b.icon}
              </div>
              <h3 className="text-subtitle text-surface-900 mb-2">{b.title}</h3>
              <p className="text-caption text-surface-500 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── How It Works ── */
  const howItWorks = (
    <section id="how-it-works" className="py-20 sm:py-28 scroll-mt-16">
      <div className="container-app">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-display text-surface-900">How It Works</h2>
          <p className="text-body text-surface-500 mt-3">
            Going from sign-up to published is fast and simple.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.number} className="relative text-center lg:text-left">
              {/* Connector line (hidden on last item and mobile) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(50%+2rem)] right-[-2rem] h-px bg-surface-200" />
              )}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand text-white text-subtitle font-semibold mb-4 relative z-10">
                {s.number}
              </div>
              <h3 className="text-subtitle text-surface-900 mb-2">{s.title}</h3>
              <p className="text-caption text-surface-500 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── Guidelines Section ── */
  const guidelines = (
    <section id="guidelines" className="py-20 sm:py-28 bg-surface-50 scroll-mt-20">
      <div className="container-app max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="text-display text-surface-900">Content Guidelines</h2>
          <p className="text-body text-surface-500 mt-3">
            Help us maintain a high-quality library that everyone can rely on.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Photo guidelines */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <h3 className="text-title text-surface-900">Photos</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Minimum 4 megapixel resolution",
                "No watermarks, borders, or excessive filters",
                "Original work only — you must own the rights",
                "Properly tagged and described for discoverability",
                "JPEG, PNG, or WebP format (max 50 MB)",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-caption text-surface-600">
                  <CheckIcon className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Video guidelines */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <h3 className="text-title text-surface-900">Videos</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Minimum 720p resolution (1080p+ preferred)",
                "Duration between 5 and 60 seconds",
                "No watermarks or intro/outro branding",
                "Original work only — you must own the rights",
                "MP4 format, stable footage preferred",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2.5 text-caption text-surface-600">
                  <CheckIcon className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );

  /* ── Rights & License ── */
  const rights = (
    <section className="py-20 sm:py-28">
      <div className="container-app max-w-3xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-display text-surface-900">Your Rights, Protected</h2>
        <p className="text-body text-surface-500 mt-4 leading-relaxed max-w-2xl mx-auto">
          When you upload to NepaLens, you grant a non-exclusive, royalty-free license
          for others to use your content — but <strong className="text-surface-700">you retain full copyright</strong>.
          You can continue to license, sell, or display your work anywhere else.
        </p>
        <div className="grid gap-4 sm:grid-cols-3 mt-10">
          {[
            { label: "You Keep Copyright", desc: "Full ownership stays with you" },
            { label: "Free to Use License", desc: "Others can use without attribution" },
            { label: "Non-Exclusive", desc: "Sell or license your work elsewhere" },
          ].map((item) => (
            <div key={item.label} className="card p-5">
              <p className="text-label text-surface-900 mb-1">{item.label}</p>
              <p className="text-caption text-surface-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── CTA Section ── */
  const ctaSection = (
    <section className="py-20 sm:py-28 bg-surface-950 text-white">
      <div className="container-app max-w-3xl text-center">
        <h2 className="text-display text-white">Ready to Get Started?</h2>
        <p className="text-body text-white/60 mt-4 max-w-xl mx-auto">
          It only takes a minute to set up. Start sharing your creative work
          with millions of people today.
        </p>

        {applyError && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-danger-500/20 text-danger-300 text-caption rounded-xl">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {applyError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          {isContributor ? (
            <Link href="/upload" className="btn btn-lg btn-primary gap-2">
              Go to Upload
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          ) : isLoggedIn ? (
            <button onClick={handleApply} disabled={applying} className="btn btn-lg btn-primary gap-2">
              {applying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Activating…
                </>
              ) : (
                <>
                  Become a Contributor
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <Link href="/register?callbackUrl=/contribute" className="btn btn-lg btn-primary gap-2">
              Sign Up to Contribute
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          )}
        </div>

        {!isLoggedIn && (
          <p className="text-caption text-white/40 mt-6">
            Already have an account?{" "}
            <Link href="/login?callbackUrl=/contribute" className="text-brand hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </section>
  );

  /* ── FAQ Section ── */
  const faqSection = (
    <section className="py-20 sm:py-28">
      <div className="container-app max-w-3xl">
        <div className="text-center mb-14">
          <h2 className="text-display text-surface-900">Frequently Asked Questions</h2>
          <p className="text-body text-surface-500 mt-3">
            Everything you need to know about contributing.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="card">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex items-center justify-between w-full px-6 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-subtitle text-surface-900 pr-4">{faq.question}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-96" : "max-h-0"}`}
                >
                  <p className="px-6 pb-5 text-caption text-surface-500 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  return (
    <main>
      {hero}
      {benefits}
      {howItWorks}
      {guidelines}
      {rights}
      {ctaSection}
      {faqSection}
    </main>
  );
}

/* ──────────────────────── CTA Button ─────────────────── */

function CTAButton({
  isLoggedIn,
  isContributor,
  applying,
  onApply,
  variant,
}: {
  isLoggedIn: boolean;
  isContributor: boolean;
  applying: boolean;
  onApply: () => void;
  variant: "primary" | "white";
}) {
  const btnClass = variant === "white" ? "btn btn-lg btn-white" : "btn btn-lg btn-primary";

  if (isContributor) {
    return (
      <Link href="/upload" className={`${btnClass} gap-2`}>
        Go to Upload
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    );
  }

  if (isLoggedIn) {
    return (
      <button onClick={onApply} disabled={applying} className={`${btnClass} gap-2`}>
        {applying ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Activating…
          </>
        ) : (
          <>
            Become a Contributor
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link href="/register?callbackUrl=/contribute" className={`${btnClass} gap-2`}>
      Sign Up to Contribute
      <ArrowRightIcon className="w-4 h-4" />
    </Link>
  );
}
