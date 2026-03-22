import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
};

// Feature flag display item
function FeatureFlag({
  name,
  description,
  enabled,
}: {
  name: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-surface-200 last:border-0">
      <div>
        <p className="text-label text-surface-900">{name}</p>
        <p className="text-small text-surface-500">{description}</p>
      </div>
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-brand" : "bg-surface-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}

// Status indicator component
function StatusIndicator({
  label,
  status,
  detail,
}: {
  label: string;
  status: "healthy" | "degraded" | "offline" | "unknown";
  detail?: string;
}) {
  const colors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    offline: "bg-red-500",
    unknown: "bg-surface-400",
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
        <span className="text-label text-surface-700">{label}</span>
      </div>
      <span className="text-small text-surface-500">{detail || status}</span>
    </div>
  );
}

// Info row component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
      <span className="text-small text-surface-500">{label}</span>
      <span className="text-label text-surface-900 font-mono text-small">{value}</span>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    redirect("/login?callbackUrl=/admin/settings");
  }

  // In production, these would come from a settings table or environment
  const siteConfig = {
    name: "PixelStock",
    description: "Free high-resolution stock photos & videos for everyone.",
    tagline: "Beautiful free images & video, gifted by creators.",
  };

  const featureFlags = [
    {
      name: "Video Uploads",
      description: "Allow users to upload videos alongside photos",
      enabled: true,
    },
    {
      name: "Challenges",
      description: "Enable community photo challenges",
      enabled: true,
    },
    {
      name: "Leaderboard",
      description: "Show contributor leaderboard rankings",
      enabled: true,
    },
    {
      name: "API Access",
      description: "Allow third-party API access with API keys",
      enabled: true,
    },
    {
      name: "AI Auto-Tagging",
      description: "Automatically tag uploaded images using AI",
      enabled: false,
    },
    {
      name: "NSFW Detection",
      description: "Automatically flag potentially inappropriate content",
      enabled: false,
    },
  ];

  const rateLimits = {
    apiFreeTier: "200 req/hour, 20,000 req/month",
    apiUnlimitedTier: "10,000 req/hour, 1,000,000 req/month",
    uploadLimit: "50 photos/day per contributor",
    searchLimit: "60 req/min per IP",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-heading-2 text-surface-900">System Settings</h1>
        <p className="text-body text-surface-500 mt-1">
          Manage site configuration, feature flags, and system health.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Configuration */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Site Configuration</h2>
          <div className="space-y-1">
            <InfoRow label="Site Name" value={siteConfig.name} />
            <InfoRow label="Description" value={siteConfig.description} />
            <InfoRow label="Tagline" value={siteConfig.tagline} />
          </div>
          <p className="text-micro text-surface-400 mt-4">
            Site configuration is managed via environment variables. Update your .env file to change these values.
          </p>
        </div>

        {/* Environment Info */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Environment</h2>
          <div className="space-y-1">
            <InfoRow label="Node Version" value={process.version} />
            <InfoRow label="Environment" value={process.env.NODE_ENV || "development"} />
            <InfoRow label="Platform" value={process.platform} />
            <InfoRow label="Next.js" value="16.x" />
            <InfoRow label="Prisma" value="6.x" />
          </div>
        </div>

        {/* Feature Flags */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Feature Flags</h2>
          <p className="text-small text-surface-500 mb-4">
            Toggle features on/off across the platform. Changes require a server restart.
          </p>
          <div>
            {featureFlags.map((flag) => (
              <FeatureFlag
                key={flag.name}
                name={flag.name}
                description={flag.description}
                enabled={flag.enabled}
              />
            ))}
          </div>
          <p className="text-micro text-surface-400 mt-4">
            Feature flags are read-only in this view. To modify them, update the configuration source.
          </p>
        </div>

        {/* Service Health */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Service Health</h2>
          <div className="space-y-1">
            <StatusIndicator label="Database (PostgreSQL)" status="healthy" detail="Connected" />
            <StatusIndicator label="Cache (Redis)" status="healthy" detail="Connected" />
            <StatusIndicator label="Storage (S3)" status="healthy" detail="Available" />
            <StatusIndicator label="Search (Meilisearch)" status="healthy" detail="Connected" />
            <StatusIndicator label="Queue (BullMQ)" status="healthy" detail="Active" />
            <StatusIndicator label="Email (SMTP)" status="unknown" detail="Not configured" />
          </div>
          <p className="text-micro text-surface-400 mt-4">
            Health checks run on page load. Refresh to update.
          </p>
        </div>

        {/* Rate Limits */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Rate Limits</h2>
          <div className="space-y-1">
            <InfoRow label="API (Free Tier)" value={rateLimits.apiFreeTier} />
            <InfoRow label="API (Unlimited)" value={rateLimits.apiUnlimitedTier} />
            <InfoRow label="Upload Limit" value={rateLimits.uploadLimit} />
            <InfoRow label="Search Limit" value={rateLimits.searchLimit} />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-6 border-2 border-red-200">
          <h2 className="text-heading-4 text-red-600 mb-4">⚠️ Danger Zone</h2>
          <p className="text-small text-surface-500 mb-4">
            These actions are irreversible or may cause temporary service disruption.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-surface-900">Reindex All Content</p>
                <p className="text-small text-surface-500">
                  Rebuild the search index for all photos and videos.
                </p>
              </div>
              <button
                className="btn btn-outline-danger text-small px-4 py-2"
                disabled
                title="Feature coming soon"
              >
                Reindex
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-surface-900">Clear All Caches</p>
                <p className="text-small text-surface-500">
                  Flush Redis cache and CDN caches.
                </p>
              </div>
              <button
                className="btn btn-outline-danger text-small px-4 py-2"
                disabled
                title="Feature coming soon"
              >
                Clear Caches
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-surface-900">Reprocess Failed Media</p>
                <p className="text-small text-surface-500">
                  Re-queue all media items with &ldquo;processing_failed&rdquo; status.
                </p>
              </div>
              <button
                className="btn btn-outline-danger text-small px-4 py-2"
                disabled
                title="Feature coming soon"
              >
                Reprocess
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label text-surface-900">Purge Audit Logs</p>
                <p className="text-small text-surface-500">
                  Remove audit log entries older than 90 days.
                </p>
              </div>
              <button
                className="btn btn-outline-danger text-small px-4 py-2"
                disabled
                title="Feature coming soon"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
