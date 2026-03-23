"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useSubscription } from "@/hooks/useSubscription";
import { triggerFileDownload } from "@/lib/download";

interface PhotoForDownload {
  id: string;
  slug?: string;
  width: number;
  height: number;
  src: string;
  isPremium?: boolean;
}

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  photo: PhotoForDownload;
}

interface DownloadVariant {
  key: string;
  label: string;
  maxWidth: number | null;
  description: string;
}

const VARIANTS: DownloadVariant[] = [
  { key: "original", label: "Original", maxWidth: null, description: "Full resolution" },
  { key: "large", label: "Large", maxWidth: 1920, description: "High quality" },
  { key: "medium", label: "Medium", maxWidth: 1280, description: "Web optimized" },
  { key: "small", label: "Small", maxWidth: 640, description: "Thumbnail" },
];

function calcDimensions(
  origW: number,
  origH: number,
  maxWidth: number | null
): string {
  if (!maxWidth || origW <= maxWidth) return `${origW} × ${origH}`;
  const ratio = origH / origW;
  const w = maxWidth;
  const h = Math.round(w * ratio);
  return `${w} × ${h}`;
}

export default function DownloadModal({
  open,
  onClose,
  photo,
}: DownloadModalProps) {
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const router = useRouter();
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (variant: DownloadVariant) => {
      // Premium images are Pro-only — block all sizes
      if (photo.isPremium && !isPro) {
        onClose();
        router.push("/pricing");
        toast("Premium photos are available only for Pro subscribers", "info");
        return;
      }

      // Block original quality for non-Pro on free images too
      if (variant.key === "original" && !isPro) {
        onClose();
        router.push("/pricing");
        toast("Upgrade to Pro for original quality downloads", "info");
        return;
      }

      setDownloadingKey(variant.key);
      try {
        const res = await fetch(
          `/api/internal/photos/${photo.id}/download`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ size: variant.key }),
          }
        );
        const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));

        if (data.upgradeRequired) {
          onClose();
          router.push("/pricing");
          toast(data.message || "Upgrade to Pro for original quality", "info");
          setDownloadingKey(null);
          return;
        }

        if (!res.ok) {
          toast(data.error || data.message || "Download failed", "error");
          setDownloadingKey(null);
          return;
        }

        if (data.url) {
          await triggerFileDownload(data.url, `pixelstock-${photo.id}-${variant.key}.jpg`);
          toast("Download started", "success");
          onClose();
        } else {
          toast(data.error || "Download link unavailable", "error");
        }
      } catch {
        toast("Download failed", "error");
      }
      setDownloadingKey(null);
    },
    [photo.id, toast, onClose, router, isPro]
  );

  const showPremiumUpsell = photo.isPremium && !isPro;

  const title = photo.isPremium
    ? (isPro ? "Download Premium Photo" : "Premium Photo")
    : "Download Photo";

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {showPremiumUpsell && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg">⭐</span>
            <div className="text-sm">
              <p className="font-medium text-amber-800">Premium Content — Pro Only</p>
              <p className="text-amber-600 text-xs mt-0.5">
                This is a premium photo. Upgrade to Pro to download it in any resolution.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {VARIANTS.map((variant) => {
          const dims = calcDimensions(photo.width, photo.height, variant.maxWidth);
          const isDownloading = downloadingKey === variant.key;
          const isOriginal = variant.key === "original";
          // Lock ALL sizes for premium + non-Pro; also lock original for non-Pro on free images
          const isLocked = (!isPro && photo.isPremium) || (isOriginal && !isPro);

          return (
            <button
              key={variant.key}
              onClick={() => isLocked
                ? (() => { onClose(); router.push("/pricing"); toast(photo.isPremium ? "Premium photos require a Pro subscription" : "Upgrade to Pro for original quality downloads", "info"); })()
                : handleDownload(variant)
              }
              disabled={downloadingKey !== null && !isLocked}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                isLocked
                  ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer"
                  : isOriginal
                    ? "border-brand/20 bg-brand-50 hover:bg-brand-100"
                    : "border-surface-200 hover:bg-surface-50"
              } ${downloadingKey !== null && !isDownloading && !isLocked ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                {isDownloading ? (
                  <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                ) : isLocked ? (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg
                    className={`w-5 h-5 ${isOriginal ? "text-brand" : "text-surface-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                )}
                <div className="text-left">
                  <p
                    className={`text-caption font-medium ${
                      isLocked ? "text-amber-700" : isOriginal ? "text-brand" : "text-surface-700"
                    }`}
                  >
                    {variant.label}
                    {isLocked ? (
                      <span className="ml-2 text-micro bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                        PRO
                      </span>
                    ) : isOriginal ? (
                      <span className="ml-2 text-micro bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                        Best
                      </span>
                    ) : null}
                  </p>
                  <p className="text-micro text-surface-400">
                    {isLocked
                      ? (photo.isPremium ? "Pro subscription required" : "Upgrade to Pro for full resolution")
                      : variant.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-micro text-surface-500 font-mono">{dims}</p>
                <p className="text-micro text-surface-400">JPG</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-micro text-surface-400 mt-4 text-center">
        {photo.isPremium
          ? (isPro ? "Pro subscriber · Commercial license included" : "Pro subscription required to download premium photos")
          : isPro
            ? "Pro subscriber · All resolutions available"
            : "Original quality requires Pro · PixelStock License"
        }
      </p>

      {!isPro && (
        <button
          onClick={() => { onClose(); router.push("/pricing"); }}
          className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all text-sm"
        >
          Upgrade to Pro — Premium Photos + Original Quality + Unlimited Downloads
        </button>
      )}
    </Modal>
  );
}
