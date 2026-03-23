import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DMCA & Copyright — NepaLens",
  description:
    "NepaLens's DMCA policy — learn how to file a takedown notice, counter-notification, and our commitment to intellectual property rights.",
};

export default function DmcaPage() {
  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-hero text-surface-900 mb-4">
          DMCA &amp; Copyright
        </h1>
        <p className="text-body text-surface-500 mb-12">
          NepaLens respects the intellectual property rights of others and
          expects our users to do the same.
        </p>

        <div className="space-y-10">
          {/* Commitment */}
          <section>
            <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-title text-surface-900 mb-2">
                    Our Commitment
                  </h2>
                  <p className="text-body text-surface-600">
                    We take copyright seriously. NepaLens complies with the
                    Digital Millennium Copyright Act (DMCA) and responds promptly
                    to valid takedown notices. If you believe your copyrighted
                    work has been uploaded without permission, we&apos;re here to
                    help.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* Filing a Takedown */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Filing a DMCA Takedown Notice
            </h2>
            <p className="text-body text-surface-600 leading-relaxed mb-4">
              If you believe that content on NepaLens infringes your copyright,
              please send a written notice to our designated DMCA agent with the
              following information:
            </p>
            <ol className="space-y-3 text-body text-surface-600 list-decimal pl-6">
              <li>
                A physical or electronic signature of the copyright owner or a
                person authorised to act on their behalf.
              </li>
              <li>
                Identification of the copyrighted work claimed to have been
                infringed.
              </li>
              <li>
                Identification of the infringing material and information
                reasonably sufficient to locate it on our platform (e.g., URL).
              </li>
              <li>
                Your contact information — including name, address, telephone
                number, and email address.
              </li>
              <li>
                A statement that you have a good faith belief that use of the
                material is not authorised by the copyright owner, its agent, or
                the law.
              </li>
              <li>
                A statement, under penalty of perjury, that the information in
                the notice is accurate and that you are the copyright owner or
                authorised to act on their behalf.
              </li>
            </ol>
          </section>

          <div className="divider" />

          {/* Counter-Notification */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Counter-Notification Process
            </h2>
            <p className="text-body text-surface-600 leading-relaxed mb-4">
              If you believe your content was removed by mistake or
              misidentification, you may file a counter-notification. Your
              counter-notification must include:
            </p>
            <ul className="space-y-3 text-body text-surface-600 list-disc pl-6">
              <li>Your physical or electronic signature.</li>
              <li>
                Identification of the content that was removed and the location
                where it appeared before removal.
              </li>
              <li>
                A statement under penalty of perjury that you have a good faith
                belief the content was removed as a result of mistake or
                misidentification.
              </li>
              <li>
                Your name, address, and telephone number, and a statement
                consenting to the jurisdiction of the federal court in your
                district.
              </li>
            </ul>
            <p className="text-body text-surface-600 leading-relaxed mt-4">
              Upon receiving a valid counter-notification, we will forward it to
              the original complainant. If the complainant does not file a court
              action within 10–14 business days, we may restore the removed
              content.
            </p>
          </section>

          <div className="divider" />

          {/* Repeat Infringer Policy */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Repeat Infringer Policy
            </h2>
            <p className="text-body text-surface-600 leading-relaxed">
              NepaLens maintains a policy of terminating the accounts of users
              who are repeat infringers of copyright. We track DMCA notices and
              take appropriate action, including permanent removal of content
              and account suspension or termination for users who repeatedly
              violate copyright laws.
            </p>
          </section>

          <div className="divider" />

          {/* Contact */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              DMCA Agent Contact
            </h2>
            <div className="card p-6 space-y-3">
              <p className="text-body text-surface-600">
                <span className="text-label text-surface-900">
                  Designated DMCA Agent:
                </span>{" "}
                NepaLens Legal Team
              </p>
              <p className="text-body text-surface-600">
                <span className="text-label text-surface-900">Email:</span>{" "}
                <a
                  href="mailto:dmca@nepalens.com"
                  className="text-brand hover:text-brand-600 transition-colors"
                >
                  dmca@nepalens.com
                </a>
              </p>
              <p className="text-body text-surface-600">
                <span className="text-label text-surface-900">Address:</span>{" "}
                NepaLens Inc., 123 Creator Lane, San Francisco, CA 94102
              </p>
            </div>
          </section>

          <div className="divider" />

          {/* Report CTA */}
          <section className="text-center pt-2">
            <p className="text-body text-surface-500 mb-4">
              Need to report content that violates copyright?
            </p>
            <Link href="/contact" className="btn btn-lg btn-primary">
              Report Content
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
