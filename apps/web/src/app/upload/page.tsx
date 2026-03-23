"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALL_ACCEPTED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
const CATEGORIES = [
  "None",
  "Nature",
  "Architecture",
  "People",
  "Animals",
  "Food & Drink",
  "Travel",
  "Technology",
  "Business",
  "Abstract",
  "Street",
  "Black & White",
];

type MediaType = "image" | "video";

interface UploadFile {
  file: File;
  preview: string;
  mediaType: MediaType;
  progress: number;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  title: string;
  description: string;
  altText: string;
  tags: string;
  category: string;
  location: string;
  challengeId: string;
  isPremium: boolean;
  width: number;
  height: number;
  duration: number;
  error?: string;
  validationError?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return "Unsupported format. Use JPEG, PNG, WebP, AVIF, MP4, MOV, or WebM.";
  if (isImage && file.size > MAX_IMAGE_SIZE) return `Image too large (${formatBytes(file.size)}). Max 50 MB.`;
  if (isVideo && file.size > MAX_VIDEO_SIZE) return `Video too large (${formatBytes(file.size)}). Max 500 MB.`;
  return null;
}

function getMediaType(file: File): MediaType {
  return VIDEO_TYPES.includes(file.type) ? "video" : "image";
}

function getVideoDimensions(file: File): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        duration: video.duration || 0,
      });
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve({ width: 1920, height: 1080, duration: 0 });
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Ready", className: "badge badge-neutral" },
  uploading: { label: "Uploading…", className: "badge badge-brand" },
  processing: { label: "Processing…", className: "badge badge-warning" },
  done: { label: "Uploaded", className: "badge badge-success" },
  error: { label: "Failed", className: "badge badge-danger" },
};

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [challenges, setChallenges] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch active challenges
  useState(() => {
    fetch("/api/internal/challenges?status=active")
      .then((r) => r.ok ? r.json() : { challenges: [] })
      .then((data) => setChallenges(data.challenges || []))
      .catch(() => {});
  });

  if (status === "loading") {
    return (
      <div className="pt-24 flex justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    router.push("/login?callbackUrl=/upload");
    return null;
  }

  const addFiles = (newFiles: FileList | File[]) => {
    let skipped = 0;

    Array.from(newFiles).forEach(async (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        skipped++;
        toast(validationError, "error");
        return;
      }
      const mediaType = getMediaType(file);
      const preview = URL.createObjectURL(file);

      // Add file immediately with default dimensions
      setFiles((prev) => [
        ...prev,
        {
          file,
          preview,
          mediaType,
          progress: 0,
          status: "pending" as const,
          title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          description: "",
          altText: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
          tags: "",
          category: "None",
          location: "",
          challengeId: "",
          isPremium: false,
          width: 0,
          height: 0,
          duration: 0,
        },
      ]);

      // Extract dimensions async
      if (mediaType === "image") {
        const img = new Image();
        img.onload = () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.preview === preview ? { ...f, width: img.naturalWidth, height: img.naturalHeight } : f
            )
          );
        };
        img.src = preview;
      } else {
        // Video: extract dimensions and duration
        const meta = await getVideoDimensions(file);
        setFiles((prev) =>
          prev.map((f) =>
            f.preview === preview ? { ...f, width: meta.width, height: meta.height, duration: meta.duration } : f
          )
        );
      }
    });

    const added = Array.from(newFiles).length - skipped;
    if (added > 0) {
      toast(`${added} file${added > 1 ? "s" : ""} added to queue`, "success");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearCompleted = () => {
    setFiles((prev) => {
      prev.filter((f) => f.status === "done").forEach((f) => URL.revokeObjectURL(f.preview));
      return prev.filter((f) => f.status !== "done");
    });
    toast("Completed uploads cleared", "info");
  };

  const uploadAll = async () => {
    // Validate required fields before starting
    let hasValidationErrors = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      if (!files[i].title.trim()) {
        updateFile(i, { validationError: "Title is required" });
        hasValidationErrors = true;
      } else {
        updateFile(i, { validationError: undefined });
      }
    }
    if (hasValidationErrors) {
      toast("Please fill in all required fields (Title) before uploading", "error");
      return;
    }

    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      updateFile(i, { status: "uploading", progress: 10 });

      try {
        // Step 1: Get presigned URL
        const presignRes = await fetch("/api/internal/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: files[i].file.type,
            filename: files[i].file.name,
          }),
        });

        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { key, url } = await presignRes.json();
        updateFile(i, { progress: 30 });

        // Step 2: Upload to S3
        await fetch(url, {
          method: "PUT",
          body: files[i].file,
          headers: { "Content-Type": files[i].file.type },
        });
        updateFile(i, { progress: 70, status: "processing" });

        // Step 3: Create media record (photo or video)
        const isVideo = files[i].mediaType === "video";
        const apiUrl = isVideo ? "/api/internal/videos" : "/api/internal/photos";
        const createRes = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            s3Key: key,
            title: files[i].title,
            description: files[i].description,
            altText: files[i].altText,
            category: files[i].category === "None" ? undefined : files[i].category,
            location: files[i].location || undefined,
            challengeId: files[i].challengeId || undefined,
            isPremium: files[i].isPremium,
            width: files[i].width,
            height: files[i].height,
            duration: isVideo ? files[i].duration : undefined,
            tags: files[i].tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        });

        if (!createRes.ok) {
          const errBody = await createRes.json().catch(() => ({}));
          throw new Error(errBody.error || `Failed to create ${isVideo ? "video" : "photo"} record (${createRes.status})`);
        }
        updateFile(i, { progress: 100, status: "done" });
        successCount++;
      } catch (err: any) {
        updateFile(i, { status: "error", error: err.message || "Upload failed" });
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0 && failCount === 0) {
      toast(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully!`, "success");
    } else if (successCount > 0 && failCount > 0) {
      toast(`${successCount} uploaded, ${failCount} failed`, "warning");
    } else if (failCount > 0) {
      toast(`Upload failed for ${failCount} file${failCount > 1 ? "s" : ""}`, "error");
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const uploadingCount = files.filter((f) => f.status === "uploading" || f.status === "processing").length;

  return (
    <div className="pt-20 pb-16">
      <div className="container-app max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-display text-surface-900 mb-2">Upload Media</h1>
          <p className="text-body text-surface-500">
            Share your best photos and videos with the PixelStock community
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`card relative rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-200 group ${
            dragOver
              ? "border-brand bg-brand/5 shadow-card-hover"
              : "border-surface-300 hover:border-brand/50 hover:bg-surface-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
            dragOver ? "bg-brand/10" : "bg-surface-100 group-hover:bg-brand/10"
          }`}>
            <svg className={`w-8 h-8 transition-colors ${dragOver ? "text-brand" : "text-surface-400 group-hover:text-brand"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-subtitle text-surface-900 mb-1.5">
            Drag & drop photos or videos here
          </p>
          <p className="text-caption text-surface-500 mb-5">
            or click to browse your files
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {["JPEG", "PNG", "WebP", "AVIF", "MP4", "MOV", "WebM"].map((fmt) => (
              <span key={fmt} className="badge badge-neutral">{fmt}</span>
            ))}
            <span className="text-micro text-surface-400">•</span>
            <span className="text-micro text-surface-400">50 MB images · 500 MB videos</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ALL_ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Upload Queue */}
        {files.length > 0 && (
          <div className="mt-10 space-y-5">
            {/* Queue Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-title text-surface-900">
                  Upload Queue
                </h2>
                <div className="flex items-center gap-2">
                  <span className="badge badge-neutral">{files.length} file{files.length > 1 ? "s" : ""}</span>
                  {doneCount > 0 && <span className="badge badge-success">{doneCount} done</span>}
                  {errorCount > 0 && <span className="badge badge-danger">{errorCount} failed</span>}
                  {uploadingCount > 0 && <span className="badge badge-brand">{uploadingCount} in progress</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doneCount > 0 && (
                  <button onClick={clearCompleted} className="btn btn-sm btn-ghost">
                    Clear completed
                  </button>
                )}
                {pendingCount > 0 && (
                  <button
                    onClick={uploadAll}
                    disabled={isUploading}
                    className="btn btn-sm btn-primary"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="divider" />

            {/* File Cards */}
            <div className="space-y-4">
              {files.map((f, i) => (
                <div key={i} className="card p-5">
                  <div className="flex gap-5">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0">
                      {f.mediaType === "video" ? (
                        <video
                          src={f.preview}
                          className="w-28 h-28 object-cover rounded-xl bg-black"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={f.preview}
                          alt={f.altText}
                          className="w-28 h-28 object-cover rounded-xl"
                        />
                      )}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <span className={STATUS_CONFIG[f.status].className}>
                          {STATUS_CONFIG[f.status].label}
                        </span>
                        {f.mediaType === "video" && (
                          <span className="badge badge-neutral">🎬 Video</span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Form */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-label text-surface-900 truncate">{f.file.name}</p>
                          <p className="text-micro text-surface-400">
                            {formatBytes(f.file.size)} • {f.file.type.split("/")[1].toUpperCase()}
                            {f.mediaType === "video" && f.duration > 0 && ` • ${Math.floor(f.duration / 60)}:${Math.floor(f.duration % 60).toString().padStart(2, "0")}`}
                            {f.width > 0 && f.height > 0 && ` • ${f.width}×${f.height}`}
                          </p>
                        </div>
                        {f.status === "pending" && (
                          <button
                            onClick={() => removeFile(i)}
                            className="btn btn-icon btn-ghost text-surface-400 hover:text-danger-500"
                            aria-label="Remove file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Editable fields for pending files */}
                      {f.status === "pending" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="form-label">Title <span className="text-danger-500">*</span></label>
                            <input
                              type="text"
                              value={f.title}
                              onChange={(e) => updateFile(i, { title: e.target.value, validationError: e.target.value.trim() ? undefined : "Title is required" })}
                              placeholder="Give your photo a title"
                              className={`input ${f.validationError ? "border-danger-500 ring-1 ring-danger-500" : ""}`}
                              required
                            />
                            {f.validationError && (
                              <p className="text-micro text-danger-500 mt-1">{f.validationError}</p>
                            )}
                          </div>
                          <div>
                            <label className="form-label">Category</label>
                            <select
                              value={f.category}
                              onChange={(e) => updateFile(i, { category: e.target.value })}
                              className="input"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="form-label">Location</label>
                            <input
                              type="text"
                              value={f.location}
                              onChange={(e) => updateFile(i, { location: e.target.value })}
                              placeholder="Where was this taken?"
                              className="input"
                            />
                          </div>
                          {challenges.length > 0 && (
                            <div>
                              <label className="form-label">Submit to Challenge</label>
                              <select
                                value={f.challengeId}
                                onChange={(e) => updateFile(i, { challengeId: e.target.value })}
                                className="input"
                              >
                                <option value="">No challenge</option>
                                {challenges.map((ch) => (
                                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <label className="form-label">Alt Text</label>
                            <input
                              type="text"
                              value={f.altText}
                              onChange={(e) => updateFile(i, { altText: e.target.value })}
                              placeholder="Describe this photo for accessibility"
                              className="input"
                            />
                            <p className="form-hint">Helps with search and screen readers</p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="form-label">Description</label>
                            <textarea
                              value={f.description}
                              onChange={(e) => updateFile(i, { description: e.target.value })}
                              placeholder="Add a description (optional)"
                              className="textarea"
                              rows={2}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="form-label">Tags</label>
                            <input
                              type="text"
                              value={f.tags}
                              onChange={(e) => updateFile(i, { tags: e.target.value })}
                              placeholder="nature, ocean, sunset"
                              className="input"
                            />
                            <p className="form-hint">Comma-separated tags to help people find your photo</p>
                            {f.tags && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {f.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag, ti) => (
                                  <span key={ti} className="chip text-micro">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="form-label flex items-center gap-3 cursor-pointer">
                              <span className="relative inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={f.isPremium}
                                  onChange={(e) => updateFile(i, { isPremium: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-surface-200 rounded-full peer peer-checked:bg-amber-500 transition-colors" />
                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                              </span>
                              <span className="flex items-center gap-2">
                                Mark as Premium
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                  ⭐ Pro
                                </span>
                              </span>
                            </label>
                            <p className="form-hint mt-1">Premium photos require a Pro subscription or use free-tier quota to download</p>
                          </div>
                        </div>
                      ) : (
                        /* Read-only summary for non-pending files */
                        <div className="space-y-1">
                          {f.title && <p className="text-caption text-surface-700">{f.title}</p>}
                          {f.tags && (
                            <div className="flex flex-wrap gap-1.5">
                              {f.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag, ti) => (
                                <span key={ti} className="chip text-micro">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progress bar */}
                      {(f.status === "uploading" || f.status === "processing") && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-micro text-surface-500">
                              {f.status === "uploading" ? "Uploading to storage…" : `Processing ${f.mediaType}…`}
                            </span>
                            <span className="text-micro text-surface-500 font-medium">{f.progress}%</span>
                          </div>
                          <div className="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-brand h-full rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${f.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Done status */}
                      {f.status === "done" && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-caption text-emerald-600 font-medium">Uploaded successfully</span>
                        </div>
                      )}

                      {/* Error status */}
                      {f.status === "error" && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="form-error mt-0">{f.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            {pendingCount > 0 && files.length > 1 && (
              <>
                <div className="divider" />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      files.forEach((f) => URL.revokeObjectURL(f.preview));
                      setFiles([]);
                    }}
                    disabled={isUploading}
                    className="btn btn-sm btn-outline"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={uploadAll}
                    disabled={isUploading}
                    className="btn btn-md btn-primary"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload all {pendingCount} file{pendingCount > 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
