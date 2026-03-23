import Link from "next/link";

const FOOTER_LINKS = {
  NepaLens: [
    { label: "License", href: "/license" },
    { label: "API", href: "/api-docs" },
    { label: "Discover", href: "/discover" },
    { label: "Collections", href: "/collections" },
    { label: "Challenges", href: "/challenges" },
  ],
  Community: [
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Upload", href: "/upload" },
    { label: "Become a Contributor", href: "/contribute" },
    { label: "Contributor Guidelines", href: "/contribute#guidelines" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "DMCA", href: "/dmca" },
    { label: "Contact", href: "/contact" },
  ],
  "Popular Searches": [
    { label: "Nature", href: "/search/nature" },
    { label: "Business", href: "/search/business" },
    { label: "Food", href: "/search/food" },
    { label: "Travel", href: "/search/travel" },
    { label: "Technology", href: "/search/technology" },
    { label: "Architecture", href: "/search/architecture" },
    { label: "People", href: "/search/people" },
    { label: "Animals", href: "/search/animals" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface-950 text-surface-400 mt-auto">
      <div className="container-app py-14">
        {/* Link grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-label text-white mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-caption text-surface-400 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-surface-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + copyright */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M2 7h3v9H2V7zm5.5-3h3v12h-3V4zM13 10h3v6h-3v-6z" fill="white" />
              </svg>
            </div>
            <p className="text-micro text-surface-500">
              © {new Date().getFullYear()} NepaLens. Free stock photos & videos shared by creators.
            </p>
          </div>

          {/* Language + social */}
          <div className="flex items-center gap-4">
            <select
              className="bg-surface-900 text-surface-400 text-micro rounded-md px-2.5 py-1.5 border border-surface-800 focus:outline-none focus:border-surface-600"
              aria-label="Language"
            >
              <option>English</option>
              <option>Español</option>
              <option>Deutsch</option>
              <option>Français</option>
              <option>日本語</option>
            </select>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                { label: "Twitter", href: "https://twitter.com", d: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                { label: "Instagram", href: "https://instagram.com", d: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" },
              ].map(({ label, href, d }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-surface-500 hover:text-white transition-colors"
                  aria-label={label}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
