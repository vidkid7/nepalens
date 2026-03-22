"use client";

import { useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PhotoForDownload {
  id: string;
  slug?: string;
  width: number;
  height: number;
  src: string;
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
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const handleDownload = useCallback(
    async (variant: DownloadVariant) => {
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
        const data = await res.json();
        if (data.url) {
          const a = document.createElement("a");
          a.href = data.url;
          a.download = `pixelstock-${photo.id}-${variant.key}.jpg`;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast("Download started", "success");
          onClose();
        } else {
          toast("Download link unavailable", "error");
        }
      } catch {
        toast("Download failed", "error");
      }
      setDownloadingKey(null);
    },
    [photo.id, toast, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} title="Download Photo" size="sm">
      <div className="space-y-2">
        {VARIANTS.map((variant) => {
          const dims = calcDimensions(photo.width, photo.height, variant.maxWidth);
          const isDownloading = downloadingKey === variant.key;
          const isOriginal = variant.key === "original";

          return (
            <button
              key={variant.key}
              onClick={() => handleDownload(variant)}
              disabled={downloadingKey !== null}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                isOriginal
                  ? "border-brand/20 bg-brand-50 hover:bg-brand-100"
                  : "border-surface-200 hover:bg-surface-50"
              } ${downloadingKey !== null && !isDownloading ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                {isDownloading ? (
                  <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
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
                      isOriginal ? "text-brand" : "text-surface-700"
                    }`}
                  >
                    {variant.label}
                    {isOriginal && (
                      <span className="ml-2 text-micro bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                        Best
                      </span>
                    )}
                  </p>
                  <p className="text-micro text-surface-400">
                    {variant.description}
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
        Free to use · No attribution required
      </p>
    </Modal>
  );
}
