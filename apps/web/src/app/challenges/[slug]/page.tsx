import { prisma } from "@pixelstock/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) return { title: "Challenge Not Found \u2014 PixelStock" };
  return {
    title: `${challenge.title} \u2014 PixelStock Challenges`,
    description: challenge.description?.slice(0, 160) || "Join this photography challenge on PixelStock.",
  };
}

function formatDate(date: Date | null) {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active": return "badge badge-success";
    case "upcoming": return "badge badge-info";
    case "ended": return "badge badge-neutral";
    default: return "badge badge-neutral";
  }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug } = await params;

  let challenge;
  try {
    challenge = await prisma.challenge.findUnique({ where: { slug } });
  } catch {
    challenge = null;
  }

  if (!challenge) notFound();

  const isActive = challenge.status === "active";
  const isEnded = challenge.status === "ended";

  let submissions: any[] = [];
  if (challenge.submissionTag) {
    try {
      submissions = await prisma.photo.findMany({
        where: {
          status: "approved",
          tags: { some: { tag: { name: challenge.submissionTag } } },
        },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
    } catch {
      submissions = [];
    }
  }

  return (
    <div className="min-h-screen">
      <section className="relative h-64 sm:h-80 overflow-hidden">
        {challenge.coverUrl ? (
          <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand via-brand-600 to-brand-800" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-app pb-8">
            <Link href="/challenges" className="inline-flex items-center gap-1.5 text-caption text-white/70 hover:text-white mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              All Challenges
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className={statusBadgeClass(challenge.status)}>{statusLabel(challenge.status)}</span>
            </div>
            <h1 className="text-display sm:text-hero text-white">{challenge.title}</h1>
          </div>
        </div>
      </section>

      <div className="container-app py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {challenge.description && (
                <div className="card p-6">
                  <h2 className="text-title text-surface-900 mb-3">About This Challenge</h2>
                  <div className="prose-content text-body text-surface-600 whitespace-pre-line">{challenge.description}</div>
                </div>
              )}

              {challenge.submissionTag && (
                <div className="card p-6">
                  <h2 className="text-title text-surface-900 mb-3">How to Enter</h2>
                  <ol className="space-y-3 text-body text-surface-600">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">1</span>
                      <span>Take a photo that fits the challenge theme.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">2</span>
                      <span>Upload your photo to PixelStock and add the tag <code className="px-1.5 py-0.5 bg-surface-100 rounded text-brand font-mono text-caption">{challenge.submissionTag}</code>.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">3</span>
                      <span>Your photo will appear in the submissions gallery below once approved.</span>
                    </li>
                  </ol>
                </div>
              )}

              <div>
                <h2 className="text-title text-surface-900 mb-4">Submissions{submissions.length > 0 && ` (${submissions.length})`}</h2>
                {submissions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {submissions.map((photo: any) => (
                      <Link key={photo.id} href={`/photo/${photo.slug}-${photo.id}`} className="aspect-square rounded-xl overflow-hidden group relative" style={{ backgroundColor: photo.dominantColor || "#e5e7eb" }}>
                        <img src={photo.thumbnailUrl || photo.originalUrl} alt={photo.altText || photo.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-body text-surface-400">No submissions yet. Be the first to enter!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <div>
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">Starts</p>
                  <p className="text-body text-surface-800 font-medium">{formatDate(challenge.startsAt)}</p>
                </div>
                <div>
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">Ends</p>
                  <p className="text-body text-surface-800 font-medium">{formatDate(challenge.endsAt)}</p>
                </div>
                {challenge.prizeDesc && (
                  <div className="pt-4 border-t border-surface-100">
                    <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">Prize</p>
                    <p className="text-body text-surface-800 font-medium flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      {challenge.prizeDesc}
                    </p>
                  </div>
                )}
              </div>

              {isActive && (
                <Link href="/upload" className="btn btn-primary w-full text-center">Submit Your Entry</Link>
              )}

              {isEnded && challenge.winnerId && (
                <div className="card p-6 border-2 border-yellow-300 bg-yellow-50">
                  <p className="text-micro text-yellow-700 uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    Winner
                  </p>
                  <p className="text-body text-surface-700">This challenge has concluded. The winner has been selected!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
