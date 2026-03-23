import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Documentation — NepaLens",
  description:
    "NepaLens API — free access to millions of stock photos and videos. Search, curate, and integrate high-quality media into your applications.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-surface-950 text-surface-200 rounded-xl p-5 overflow-x-auto text-sm leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/search?query=nature",
    title: "Search Photos",
    description: "Search for photos matching a query string. Returns paginated results.",
    params: [
      { name: "query", type: "string", required: true, desc: "Search term" },
      { name: "page", type: "number", required: false, desc: "Page number (default: 1)" },
      { name: "per_page", type: "number", required: false, desc: "Results per page (default: 15, max: 80)" },
      { name: "orientation", type: "string", required: false, desc: '"landscape", "portrait", or "square"' },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/curated",
    title: "Get Curated Photos",
    description: "Returns a curated list of trending, hand-picked photos.",
    params: [
      { name: "page", type: "number", required: false, desc: "Page number (default: 1)" },
      { name: "per_page", type: "number", required: false, desc: "Results per page (default: 15, max: 80)" },
    ],
  },
  {
    method: "GET",
    path: "/api/v1/photos/:id",
    title: "Get a Photo",
    description: "Retrieve details and download URLs for a specific photo by ID.",
    params: [
      { name: "id", type: "number", required: true, desc: "The photo ID" },
    ],
  },
];

const ERROR_CODES = [
  { code: "200", meaning: "OK — Request succeeded." },
  { code: "400", meaning: "Bad Request — Invalid parameters." },
  { code: "401", meaning: "Unauthorized — Missing or invalid API key." },
  { code: "403", meaning: "Forbidden — You don't have access to this resource." },
  { code: "404", meaning: "Not Found — The requested resource doesn't exist." },
  { code: "429", meaning: "Too Many Requests — Rate limit exceeded." },
  { code: "500", meaning: "Internal Server Error — Something went wrong on our end." },
];

const SAMPLE_RESPONSE = `{
  "page": 1,
  "per_page": 15,
  "total_results": 8420,
  "photos": [
    {
      "id": 2014422,
      "width": 4000,
      "height": 6000,
      "url": "https://nepalens.com/photo/2014422",
      "photographer": "Jane Doe",
      "photographer_url": "https://nepalens.com/@janedoe",
      "avg_color": "#6B8F71",
      "src": {
        "original": "https://images.nepalens.com/photos/2014422/original.jpeg",
        "large2x": "https://images.nepalens.com/photos/2014422/large2x.jpeg",
        "large": "https://images.nepalens.com/photos/2014422/large.jpeg",
        "medium": "https://images.nepalens.com/photos/2014422/medium.jpeg",
        "small": "https://images.nepalens.com/photos/2014422/small.jpeg"
      }
    }
  ]
}`;

export default function ApiDocsPage() {
  return (
    <div className="container-app py-16">
      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="badge badge-brand mb-4">Free &amp; Open</div>
        <h1 className="text-hero text-surface-900 mb-4">NepaLens API</h1>
        <p className="text-subtitle text-surface-500 max-w-2xl mx-auto">
          Access millions of free stock photos and videos programmatically.
          Build beautiful apps, power your content, and delight your users.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-12">
          {/* Overview */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">Overview</h2>
            <p className="text-body text-surface-600 leading-relaxed">
              The NepaLens API provides a simple RESTful interface for
              searching, browsing, and downloading high-quality stock media. All
              responses are returned in JSON format. The API is free to use for
              both personal and commercial projects.
            </p>
          </section>

          <div className="divider" />

          {/* Authentication */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Authentication
            </h2>
            <p className="text-body text-surface-600 leading-relaxed mb-4">
              All API requests require an API key. Include your key in the{" "}
              <code className="bg-surface-100 px-1.5 py-0.5 rounded text-sm text-surface-800">
                Authorization
              </code>{" "}
              header:
            </p>
            <CodeBlock>
              {`curl -H "Authorization: YOUR_API_KEY" \\
  https://api.nepalens.com/api/v1/curated`}
            </CodeBlock>
            <p className="text-body text-surface-500 mt-4">
              You can generate an API key from your{" "}
              <Link href="/settings" className="text-brand hover:text-brand-600 underline">
                account settings
              </Link>
              .
            </p>
          </section>

          <div className="divider" />

          {/* Rate Limits */}
          <section>
            <h2 className="text-title text-surface-900 mb-4">Rate Limits</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-label text-surface-900 mb-1">Free Tier</h3>
                <p className="text-2xl font-bold text-brand">200</p>
                <p className="text-caption text-surface-500">
                  requests per hour
                </p>
              </div>
              <div className="card p-5">
                <h3 className="text-label text-surface-900 mb-1">
                  Unlimited Tier
                </h3>
                <p className="text-2xl font-bold text-surface-900">∞</p>
                <p className="text-caption text-surface-500">
                  requests per hour
                </p>
              </div>
            </div>
            <p className="text-body text-surface-500 mt-4">
              Rate limit status is returned in response headers:{" "}
              <code className="bg-surface-100 px-1.5 py-0.5 rounded text-sm text-surface-800">
                X-RateLimit-Remaining
              </code>
              .
            </p>
          </section>

          <div className="divider" />

          {/* Endpoints */}
          <section>
            <h2 className="text-title text-surface-900 mb-6">Endpoints</h2>
            <div className="space-y-8">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="card p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge badge-brand font-mono">
                      {ep.method}
                    </span>
                    <code className="text-sm text-surface-800 font-mono">
                      {ep.path}
                    </code>
                  </div>
                  <h3 className="text-subtitle text-surface-900 mb-1">
                    {ep.title}
                  </h3>
                  <p className="text-body text-surface-500 mb-4">
                    {ep.description}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-surface-200 text-label text-surface-700">
                          <th className="pb-2 pr-4">Parameter</th>
                          <th className="pb-2 pr-4">Type</th>
                          <th className="pb-2 pr-4">Required</th>
                          <th className="pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-body text-surface-600">
                        {ep.params.map((p) => (
                          <tr
                            key={p.name}
                            className="border-b border-surface-100"
                          >
                            <td className="py-2 pr-4 font-mono text-sm text-surface-800">
                              {p.name}
                            </td>
                            <td className="py-2 pr-4">{p.type}</td>
                            <td className="py-2 pr-4">
                              {p.required ? (
                                <span className="badge badge-brand">Yes</span>
                              ) : (
                                <span className="badge badge-neutral">No</span>
                              )}
                            </td>
                            <td className="py-2">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* Response Example */}
          <section>
            <h2 className="text-title text-surface-900 mb-3">
              Response Example
            </h2>
            <p className="text-body text-surface-500 mb-4">
              A successful search request returns a JSON object with pagination
              metadata and an array of photo objects:
            </p>
            <CodeBlock>{SAMPLE_RESPONSE}</CodeBlock>
          </section>

          <div className="divider" />

          {/* Error Codes */}
          <section>
            <h2 className="text-title text-surface-900 mb-4">Error Codes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200 text-label text-surface-700">
                    <th className="pb-2 pr-6">Code</th>
                    <th className="pb-2">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-body text-surface-600">
                  {ERROR_CODES.map((e) => (
                    <tr
                      key={e.code}
                      className="border-b border-surface-100"
                    >
                      <td className="py-2.5 pr-6 font-mono font-medium text-surface-800">
                        {e.code}
                      </td>
                      <td className="py-2.5">{e.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="divider" />

          {/* CTA */}
          <section className="text-center pt-2">
            <h2 className="text-title text-surface-900 mb-3">
              Ready to Build?
            </h2>
            <p className="text-body text-surface-500 mb-6">
              Generate your free API key and start building in minutes.
            </p>
            <Link href="/settings" className="btn btn-lg btn-primary">
              Get Your API Key
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
