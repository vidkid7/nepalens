import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center — NepaLens",
  description:
    "Get help with NepaLens — find answers, explore guides, and contact our support team.",
};

const CATEGORIES = [
  {
    title: "Getting Started",
    description: "New to NepaLens? Learn how to browse, download, and use free stock content.",
    href: "/faq",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Licensing & Usage",
    description: "Understand what you can and can't do with content from NepaLens.",
    href: "/license",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Contributing Photos",
    description: "Learn how to upload, manage, and share your photography with the world.",
    href: "/contribute",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Account & Settings",
    description: "Manage your profile, preferences, security, and notification settings.",
    href: "/settings",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "API & Developers",
    description: "Integrate NepaLens into your app with our free REST API.",
    href: "/api-docs",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: "Report an Issue",
    description: "Found a bug or need to report content? Let us know and we'll help.",
    href: "/contact",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const POPULAR_ARTICLES = [
  { title: "What license does NepaLens use?", href: "/license" },
  { title: "How to upload photos", href: "/contribute" },
  { title: "Can I use photos for commercial projects?", href: "/faq" },
  { title: "Getting started with the NepaLens API", href: "/api-docs" },
  { title: "Understanding the DMCA process", href: "/dmca" },
  { title: "Privacy and data handling", href: "/privacy" },
];

export default function HelpPage() {
  return (
    <div className="container-app py-16">
      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center mb-14">
        <h1 className="text-hero text-surface-900 mb-4">
          How can we help?
        </h1>
        <p className="text-subtitle text-surface-500 mb-8">
          Search our help center or browse topics below.
        </p>

        {/* Search (decorative — links to FAQ) */}
        <Link
          href="/faq"
          className="relative block max-w-md mx-auto group"
        >
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-hover:text-brand transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="input input-lg pl-12 text-surface-400 cursor-pointer group-hover:border-brand transition-colors">
            Search for answers…
          </div>
        </Link>
      </div>

      {/* Category Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
        {CATEGORIES.map((cat) => (
          <Link key={cat.title} href={cat.href} className="card-interactive p-6 group">
            <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:bg-brand group-hover:text-white transition-colors">
              {cat.icon}
            </div>
            <h2 className="text-subtitle text-surface-900 mb-1">
              {cat.title}
            </h2>
            <p className="text-body text-surface-500">{cat.description}</p>
          </Link>
        ))}
      </div>

      {/* Popular Articles */}
      <div className="max-w-2xl mx-auto mb-16">
        <h2 className="text-title text-surface-900 mb-6 text-center">
          Popular Articles
        </h2>
        <div className="space-y-2">
          {POPULAR_ARTICLES.map((article) => (
            <Link
              key={article.title}
              href={article.href}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl hover:bg-surface-50 transition-colors group"
            >
              <svg
                className="w-4 h-4 text-surface-300 group-hover:text-brand transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-body text-surface-700 group-hover:text-surface-900 transition-colors">
                {article.title}
              </span>
              <svg
                className="w-4 h-4 text-surface-300 group-hover:text-brand ml-auto flex-shrink-0 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="max-w-lg mx-auto text-center bg-surface-50 rounded-2xl p-8 sm:p-10">
        <h2 className="text-title text-surface-900 mb-2">
          Still need help?
        </h2>
        <p className="text-body text-surface-500 mb-6">
          Our support team is happy to assist you with any questions.
        </p>
        <Link href="/contact" className="btn btn-lg btn-primary">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
