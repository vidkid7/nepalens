"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Helper components ─────────────────────────────────────────── */
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
      <span className="text-small text-surface-500">{label}</span>
      <span className="text-label text-surface-900 font-mono text-small">{value}</span>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────────── */
type HealthStatus = "healthy" | "degraded" | "offline" | "unknown";

interface HealthMap {
  database: { status: HealthStatus; detail: string };
  cache: { status: HealthStatus; detail: string };
  storage: { status: HealthStatus; detail: string };
  email: { status: HealthStatus; detail: string };
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function AdminSettingsPage() {
  const [health, setHealth] = useState<HealthMap | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setHealth(data.health);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  async function runAction(action: string, label: string) {
    if (!confirm(`Are you sure you want to ${label.toLowerCase()}? This action may be irreversible.`)) return;
    setLoadingAction(action);
    setActionResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult({ type: "success", message: data.message });
        if (action === "clear-caches") fetchHealth();
      } else {
        setActionResult({ type: "error", message: data.error || "Action failed" });
      }
    } catch {
      setActionResult({ type: "error", message: "Network error" });
    } finally {
      setLoadingAction(null);
    }
  }

  const featureFlags = [
    { name: "Video Uploads", description: "Allow users to upload videos alongside photos", enabled: true },
    { name: "Challenges", description: "Enable community photo challenges", enabled: true },
    { name: "Leaderboard", description: "Show contributor leaderboard rankings", enabled: true },
    { name: "API Access", description: "Allow third-party API access with API keys", enabled: true },
    { name: "AI Auto-Tagging", description: "Automatically tag uploaded images using AI", enabled: false },
    { name: "NSFW Detection", description: "Automatically flag potentially inappropriate content", enabled: false },
  ];

  const rateLimits = {
    apiFreeTier: "200 req/hour, 20,000 req/month",
    apiUnlimitedTier: "10,000 req/hour, 1,000,000 req/month",
    uploadLimit: "50 photos/day per contributor",
    searchLimit: "60 req/min per IP",
  };

  const dangerActions = [
    {
      id: "clear-caches",
      label: "Clear All Caches",
      description: "Flush Redis cache and in-memory caches.",
      buttonText: "Clear Caches",
    },
    {
      id: "reprocess-failed",
      label: "Reprocess Failed Media",
      description: "Re-queue all media with \"processing_failed\" status back to pending review.",
      buttonText: "Reprocess",
    },
    {
      id: "purge-audit",
      label: "Purge Audit Logs",
      description: "Remove audit log entries older than 90 days.",
      buttonText: "Purge",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-heading-2 text-surface-900">System Settings</h1>
        <p className="text-body text-surface-500 mt-1">
          Manage site configuration, feature flags, and system health.
        </p>
      </div>

      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-4 rounded-lg text-label ${
            actionResult.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {actionResult.message}
          <button onClick={() => setActionResult(null)} className="ml-4 text-small underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Configuration */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Site Configuration</h2>
          <div className="space-y-1">
            <InfoRow label="Site Name" value="PixelStock" />
            <InfoRow label="Description" value="Free high-resolution stock photos & videos for everyone." />
            <InfoRow label="Tagline" value="Beautiful free images & video, gifted by creators." />
          </div>
          <p className="text-micro text-surface-400 mt-4">
            Site configuration is managed via environment variables. Update your .env file to change these values.
          </p>
        </div>

        {/* Environment Info */}
        <div className="card p-6">
          <h2 className="text-heading-4 text-surface-900 mb-4">Environment</h2>
          <div className="space-y-1">
            <InfoRow label="Environment" value={process.env.NODE_ENV || "development"} />
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
              <FeatureFlag key={flag.name} name={flag.name} description={flag.description} enabled={flag.enabled} />
            ))}
          </div>
          <p className="text-micro text-surface-400 mt-4">
            Feature flags are read-only in this view. To modify them, update the configuration source.
          </p>
        </div>

        {/* Service Health */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading-4 text-surface-900">Service Health</h2>
            <button onClick={fetchHealth} className="text-micro text-brand hover:underline">
              Refresh
            </button>
          </div>
          {health ? (
            <div className="space-y-1">
              <StatusIndicator label="Database (PostgreSQL)" status={health.database?.status as HealthStatus || "unknown"} detail={health.database?.detail} />
              <StatusIndicator label="Cache (Redis)" status={health.cache?.status as HealthStatus || "unknown"} detail={health.cache?.detail} />
              <StatusIndicator label="Storage (Cloudinary)" status={health.storage?.status as HealthStatus || "unknown"} detail={health.storage?.detail} />
              <StatusIndicator label="Email (SMTP)" status={health.email?.status as HealthStatus || "unknown"} detail={health.email?.detail} />
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-surface-100 rounded animate-pulse" />
              ))}
            </div>
          )}
          <p className="text-micro text-surface-400 mt-4">
            Health checks run on page load. Click refresh to update.
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
            {dangerActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between">
                <div>
                  <p className="text-label text-surface-900">{action.label}</p>
                  <p className="text-small text-surface-500">{action.description}</p>
                </div>
                <button
                  className="btn btn-outline-danger text-small px-4 py-2 whitespace-nowrap disabled:opacity-50"
                  disabled={loadingAction !== null}
                  onClick={() => runAction(action.id, action.label)}
                >
                  {loadingAction === action.id ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Running…
                    </span>
                  ) : (
                    action.buttonText
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
