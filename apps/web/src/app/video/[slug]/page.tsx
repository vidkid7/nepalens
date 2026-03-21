import { Metadata } from "next";
import Link from "next/link";

interface VideoPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const parts = params.slug.split("-");
  const name = parts.slice(0, -1).join(" ");
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    title: `${title} — Free Stock Video | PixelStock`,
    description: `Download this free video: ${title}. Free for personal and commercial use.`,
  };
}

export default function VideoDetailPage({ params }: VideoPageProps) {
  const parts = params.slug.split("-");
  const videoId = parts[parts.length - 1];
  const name = parts.slice(0, -1).join(" ");
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="container-app py-8">
      <div className="max-w-5xl mx-auto">
        {/* Video Player */}
        <div className="bg-black rounded-2xl overflow-hidden mb-6 aspect-video flex items-center justify-center shadow-lg">
          <div className="text-center text-white/40">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="text-caption text-white/60">{title || "Untitled Video"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Actions */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-title text-surface-900">{title || "Untitled Video"}</h1>
                <p className="text-caption text-surface-500 mt-1">Free stock video</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="btn btn-sm btn-ghost" aria-label="Like">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="btn btn-sm btn-ghost" aria-label="Save">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                <button className="btn btn-sm btn-ghost" aria-label="Share">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Video info */}
            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-3">Video Information</h3>
              <div className="grid grid-cols-2 gap-3 text-caption">
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">Duration</span>
                  <span className="text-surface-900 font-medium">—</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">Resolution</span>
                  <span className="text-surface-900 font-medium">1080p</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">Format</span>
                  <span className="text-surface-900 font-medium">MP4</span>
                </div>
                <div className="flex justify-between py-2 border-b border-surface-100">
                  <span className="text-surface-500">License</span>
                  <Link href="/license" className="text-brand font-medium hover:underline">Free</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Download options */}
            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-3">Download</h3>
              <div className="space-y-2">
                {[
                  { label: "HD", res: "1280×720", size: "~15 MB" },
                  { label: "Full HD", res: "1920×1080", size: "~35 MB" },
                  { label: "4K", res: "3840×2160", size: "~120 MB" },
                ].map((opt) => (
                  <button key={opt.label} className="w-full btn btn-sm btn-primary justify-between">
                    <span>Download {opt.label}</span>
                    <span className="text-micro opacity-70">{opt.size}</span>
                  </button>
                ))}
              </div>
              <p className="text-micro text-surface-400 mt-3">Free for personal and commercial use.</p>
            </div>

            {/* Tags placeholder */}
            <div className="card p-5">
              <h3 className="text-label text-surface-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {(title || "stock video").split(" ").filter(Boolean).map((word) => (
                  <Link key={word} href={`/search/${word.toLowerCase()}`} className="chip">
                    {word.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
