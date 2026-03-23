"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

const SUBJECTS = [
  "General Inquiry",
  "Support",
  "DMCA / Copyright",
  "Partnership",
  "Press",
] as const;

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.message.trim()) next.message = "Message is required.";
    else if (form.message.trim().length < 10)
      next.message = "Message must be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    // Placeholder — replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="container-app py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-hero text-surface-900 mb-3">Message Sent!</h1>
          <p className="text-body text-surface-500 mb-8">
            Thank you for reaching out. We&apos;ll get back to you within 1–2
            business days.
          </p>
          <Link href="/" className="btn btn-md btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-hero text-surface-900 mb-4">Get in Touch</h1>
        <p className="text-body text-surface-500 mb-12">
          Have a question or feedback? We&apos;d love to hear from you.
        </p>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-5">
            <div>
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                id="name"
                type="text"
                className={`input ${errors.name ? "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500" : ""}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`input ${errors.email ? "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500" : ""}`}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="subject" className="form-label">
                Subject
              </label>
              <select
                id="subject"
                className="input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value as typeof form.subject })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="form-label">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className={`textarea ${errors.message ? "border-danger-500 focus:ring-danger-500/20 focus:border-danger-500" : ""}`}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {errors.message && (
                <p className="form-error">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn btn-lg btn-primary w-full sm:w-auto"
            >
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-2">Email Us</h3>
              <a
                href="mailto:support@nepalens.com"
                className="text-body text-brand hover:text-brand-600 transition-colors"
              >
                support@nepalens.com
              </a>
            </div>

            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-2">
                Response Time
              </h3>
              <p className="text-body text-surface-500">
                We typically respond within 1–2 business days.
              </p>
            </div>

            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-2">
                Quick Answers
              </h3>
              <p className="text-body text-surface-500 mb-3">
                Check our FAQ for instant answers to common questions.
              </p>
              <Link href="/faq" className="btn btn-sm btn-outline">
                Visit FAQ
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
