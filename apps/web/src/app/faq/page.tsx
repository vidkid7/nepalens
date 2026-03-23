"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type FaqItem = { q: string; a: string };
type FaqCategory = { name: string; items: FaqItem[] };

const FAQ_DATA: FaqCategory[] = [
  {
    name: "General",
    items: [
      {
        q: "What is NepaLens?",
        a: "NepaLens is a free stock photo and video platform powered by a global community of creators. All content is free for personal and commercial use.",
      },
      {
        q: "Is NepaLens really free?",
        a: "Yes! All photos and videos on NepaLens are 100% free to download and use. There are no hidden fees, subscriptions, or paywalls.",
      },
      {
        q: "Do I need an account to download?",
        a: "No. You can browse and download content without creating an account. However, an account lets you save collections, follow creators, and upload your own work.",
      },
      {
        q: "How does NepaLens make money?",
        a: "NepaLens is supported through partnerships, our API program, and optional promoted placements. The core platform and all content remain free.",
      },
    ],
  },
  {
    name: "Licensing",
    items: [
      {
        q: "Can I use NepaLens photos for commercial projects?",
        a: "Absolutely. All content on NepaLens is free for commercial and personal use — including websites, apps, marketing materials, products, and more.",
      },
      {
        q: "Do I need to give attribution?",
        a: 'Attribution is not required, but it is always appreciated. A simple credit like "Photo by [Photographer] on NepaLens" helps support our community.',
      },
      {
        q: "Can I modify the photos and videos?",
        a: "Yes. You are free to edit, crop, resize, and adapt any content to suit your needs.",
      },
      {
        q: "What am I not allowed to do?",
        a: "You cannot sell unaltered copies, redistribute on competing stock platforms, imply endorsement by identifiable people, or use content in AI training datasets. See our full license for details.",
      },
    ],
  },
  {
    name: "Contributing",
    items: [
      {
        q: "How do I upload photos or videos?",
        a: 'Create a free account, then click "Upload" in the navigation bar. You can upload individual files or batch uploads. All submissions go through a quality review.',
      },
      {
        q: "What formats are supported?",
        a: "We accept JPEG and PNG for photos (minimum 4 megapixels), and MP4 for videos (minimum 720p). RAW files are not currently supported.",
      },
      {
        q: "How does the moderation process work?",
        a: "Every submission is reviewed by our team for quality, relevance, and compliance with our guidelines. Reviews typically take 24–48 hours.",
      },
      {
        q: "Can I remove my uploaded content?",
        a: 'Yes. You can delete any of your uploads at any time from your profile. Go to your photo, click the menu icon, and select "Delete".',
      },
    ],
  },
  {
    name: "Account",
    items: [
      {
        q: "How do I create an account?",
        a: 'Click "Join" in the top navigation. You can sign up with your email or use Google / GitHub authentication.',
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Account and click \"Delete Account\". This will permanently remove your profile and all associated data. Your previously published content will remain on the platform under the NepaLens license.",
      },
      {
        q: "I forgot my password. What do I do?",
        a: 'Click "Sign In" and then "Forgot password?" to receive a password reset link via email.',
      },
    ],
  },
  {
    name: "Technical",
    items: [
      {
        q: "Does NepaLens have an API?",
        a: "Yes! Our free API lets you search and download photos and videos programmatically. Visit our API documentation to learn more and get your API key.",
      },
      {
        q: "What are the API rate limits?",
        a: "The free tier allows 200 requests per hour. For higher limits, contact us about our unlimited tier.",
      },
      {
        q: "Is there a mobile app?",
        a: "Not yet, but our website is fully responsive and works great on mobile devices. A native app is on our roadmap.",
      },
      {
        q: "What image resolutions are available?",
        a: "Each photo is available in multiple sizes: Original, Large (2x), Large, Medium, and Small. You can choose the resolution that best fits your project.",
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-50 transition-colors"
      >
        <span className="text-subtitle text-surface-900">{item.q}</span>
        <svg
          className={`w-5 h-5 text-surface-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-body text-surface-600 leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [search]);

  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-hero text-surface-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-subtitle text-surface-500 max-w-xl mx-auto mb-8">
            Find answers to common questions about NepaLens.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search FAQs…"
              className="input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* FAQ List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-surface-500 mb-4">
              No results found for &quot;{search}&quot;.
            </p>
            <button
              onClick={() => setSearch("")}
              className="btn btn-sm btn-outline"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <section key={cat.name}>
                <h2 className="text-title text-surface-900 mb-4">
                  {cat.name}
                </h2>
                <div className="space-y-3">
                  {cat.items.map((item) => {
                    const key = `${cat.name}-${item.q}`;
                    return (
                      <AccordionItem
                        key={key}
                        item={item}
                        isOpen={openKey === key}
                        onToggle={() =>
                          setOpenKey(openKey === key ? null : key)
                        }
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Contact CTA */}
        <div className="divider mt-14 mb-10" />
        <div className="text-center">
          <p className="text-body text-surface-500 mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <Link href="/contact" className="btn btn-md btn-primary">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
