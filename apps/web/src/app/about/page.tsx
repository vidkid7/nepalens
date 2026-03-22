import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — PixelStock",
  description:
    "Learn about PixelStock — the free stock photo and video platform built by creators, for creators.",
};

const STATS = [
  { value: "50K+", label: "Contributors" },
  { value: "2M+", label: "Free Photos & Videos" },
  { value: "500M+", label: "Downloads" },
  { value: "180+", label: "Countries" },
];

const VALUES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Quality First",
    description:
      "Every photo and video is reviewed to ensure it meets our high quality standards before being published.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Community Driven",
    description:
      "Our platform is powered by a passionate global community of photographers and videographers sharing their best work.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    title: "Always Free",
    description:
      "All content is free for personal and commercial use. No hidden fees, no subscriptions, no strings attached.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Creator Respect",
    description:
      "We celebrate and credit our contributors. Every creator gets a profile, stats, and community recognition.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-app py-16">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-hero text-surface-900 mb-4">About PixelStock</h1>
        <p className="text-subtitle text-surface-500 max-w-2xl mx-auto">
          The best free stock photos, royalty free images &amp; videos shared by
          a talented community of creators.
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-3xl mx-auto mb-20">
        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-8 sm:p-10">
          <h2 className="text-title text-surface-900 mb-3">Our Mission</h2>
          <p className="text-body text-surface-600 leading-relaxed">
            We believe that high-quality visuals should be accessible to
            everyone — whether you&apos;re a startup building a landing page, a
            student working on a project, or a non-profit telling an important
            story. PixelStock exists to empower creators worldwide with free,
            stunning photography and video.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto mb-20">
        <h2 className="text-title text-surface-900 mb-3">Our Story</h2>
        <div className="space-y-4 text-body text-surface-600 leading-relaxed">
          <p>
            PixelStock was founded by creators who were frustrated by the state
            of stock photography — expensive licenses, generic imagery, and
            restrictive terms. We knew there had to be a better way.
          </p>
          <p>
            What started as a small collection of freely shared photos has grown
            into one of the largest community-driven media libraries in the
            world. Every day, talented photographers and videographers from over
            180 countries contribute their work to help others bring their ideas
            to life.
          </p>
          <p>
            We&apos;re proud to be a platform that puts creators first —
            providing tools, recognition, and a supportive community to help them
            grow and share their talent with the world.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="card text-center p-6 sm:p-8"
            >
              <div className="text-3xl sm:text-4xl font-bold text-brand mb-1">
                {stat.value}
              </div>
              <div className="text-caption text-surface-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="max-w-4xl mx-auto mb-20">
        <h2 className="text-title text-surface-900 text-center mb-10">
          What We Stand For
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                {v.icon}
              </div>
              <h3 className="text-subtitle text-surface-900 mb-2">
                {v.title}
              </h3>
              <p className="text-body text-surface-500">{v.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-title text-surface-900 mb-3">
          Join Our Community
        </h2>
        <p className="text-body text-surface-500 mb-6">
          Share your photography with millions of people worldwide. Become a
          PixelStock contributor today.
        </p>
        <Link href="/contribute" className="btn btn-lg btn-primary">
          Become a Contributor
        </Link>
      </div>
    </div>
  );
}
