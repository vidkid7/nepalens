import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — NepaLens",
  description:
    "Learn how NepaLens uses cookies and similar technologies to provide, improve, and secure our services.",
};

export default function CookiesPage() {
  return (
    <div className="container-app py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-hero text-surface-900 mb-4">Cookie Policy</h1>
        <p className="text-body text-surface-500 mb-12">
          Last updated: March 2026
        </p>

        <div className="space-y-10">
          {/* What Are Cookies */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              What Are Cookies?
            </h2>
            <p className="text-body text-surface-600 leading-relaxed">
              Cookies are small text files that are stored on your device when
              you visit a website. They are widely used to make websites work
              more efficiently and to provide information to the owners of the
              site. Cookies allow us to recognise your browser and remember
              certain information about your visit, such as your preferred
              settings.
            </p>
          </section>

          <div className="divider" />

          {/* How We Use Cookies */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              How We Use Cookies
            </h2>
            <p className="text-body text-surface-600 leading-relaxed">
              NepaLens uses cookies and similar tracking technologies to
              provide, personalise, and improve our services. We use them to keep
              you signed in, remember your preferences, understand how you
              interact with our platform, and measure the effectiveness of our
              communications.
            </p>
          </section>

          <div className="divider" />

          {/* Types of Cookies */}
          <section>
            <h2 className="text-title text-surface-900 mb-4">
              Types of Cookies We Use
            </h2>
            <div className="space-y-5">
              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-subtitle text-surface-900 mb-1">
                      Essential Cookies
                    </h3>
                    <p className="text-body text-surface-500">
                      Required for the platform to function. They enable core
                      features like authentication, security, and accessibility.
                      These cookies cannot be disabled.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-subtitle text-surface-900 mb-1">
                      Analytics Cookies
                    </h3>
                    <p className="text-body text-surface-500">
                      Help us understand how visitors interact with NepaLens by
                      collecting information anonymously. This data lets us
                      improve our platform experience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-subtitle text-surface-900 mb-1">
                      Preference Cookies
                    </h3>
                    <p className="text-body text-surface-500">
                      Allow NepaLens to remember choices you make — such as
                      language, region, or display settings — so we can provide a
                      more personalised experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="divider" />

          {/* Managing Cookies */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Managing Cookies
            </h2>
            <p className="text-body text-surface-600 leading-relaxed mb-3">
              Most web browsers allow you to control cookies through their
              settings. You can set your browser to refuse cookies or delete
              certain cookies. However, if you block or delete cookies, some
              features of NepaLens may not work as intended.
            </p>
            <p className="text-body text-surface-600 leading-relaxed">
              To learn more about managing cookies, visit your browser&apos;s
              help documentation or go to{" "}
              <a
                href="https://www.allaboutcookies.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-600 underline"
              >
                www.allaboutcookies.org
              </a>
              .
            </p>
          </section>

          <div className="divider" />

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Third-Party Cookies
            </h2>
            <p className="text-body text-surface-600 leading-relaxed">
              In some cases, we use trusted third-party services that also set
              cookies on our behalf. These include analytics providers and
              authentication services. Third-party cookies are governed by the
              respective provider&apos;s privacy policy, not ours.
            </p>
          </section>

          <div className="divider" />

          {/* Updates */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Updates to This Policy
            </h2>
            <p className="text-body text-surface-600 leading-relaxed mb-3">
              We may update this Cookie Policy from time to time to reflect
              changes in technology, regulation, or our business practices. When
              we make changes, we will update the &quot;Last updated&quot; date
              at the top of this page.
            </p>
            <p className="text-body text-surface-600 leading-relaxed">
              For more information about how we handle your data, please see our{" "}
              <Link
                href="/privacy"
                className="text-brand hover:text-brand-600 underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
