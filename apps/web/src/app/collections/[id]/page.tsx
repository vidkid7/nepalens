import { prisma } from "@nepalens/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import CollectionDetailClient from "./CollectionDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { user: { select: { displayName: true, username: true } } },
  });
  if (!collection) return { title: "Collection Not Found \u2014 NepaLens" };
  return {
    title: `${collection.title} \u2014 NepaLens`,
    description: collection.description || `A curated collection by ${collection.user.displayName || collection.user.username}.`,
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;

  let collection;
  try {
    collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            photo: { select: { id: true, slug: true, altText: true, originalUrl: true, dominantColor: true, width: true, height: true, cdnKey: true } },
            video: { select: { id: true, slug: true, altText: true, thumbnailUrl: true, width: true, height: true } },
          },
        },
      },
    });
  } catch {
    collection = null;
  }

  if (!collection) notFound();
  if (collection.isPrivate && collection.userId !== currentUserId) notFound();

  const isOwner = currentUserId === collection.userId;

  return (
    <div className="container-app py-16">
      <div className="max-w-6xl mx-auto">
        <Link href="/collections" className="inline-flex items-center gap-1.5 text-caption text-surface-500 hover:text-brand mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Collections
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-display text-surface-900">{collection.title}</h1>
              {collection.isPrivate && (
                <span className="badge badge-neutral flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Private
                </span>
              )}
            </div>
            {collection.description && <p className="text-body text-surface-500 max-w-2xl mb-4">{collection.description}</p>}
            <div className="flex items-center gap-3">
              <Link href={`/profile/${collection.user.username}`} className="flex items-center gap-2 group">
                <Avatar src={collection.user.avatarUrl} name={collection.user.displayName || collection.user.username} size="sm" />
                <span className="text-caption text-surface-600 group-hover:text-brand transition-colors">{collection.user.displayName || collection.user.username}</span>
              </Link>
              <span className="text-micro text-surface-400">\u00b7 {collection.itemsCount} {collection.itemsCount === 1 ? "item" : "items"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CollectionDetailClient collectionId={collection.id} isOwner={isOwner} />
          </div>
        </div>

        {collection.items.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-subtitle text-surface-700 mb-1">This collection is empty</h3>
            <p className="text-caption text-surface-400">{isOwner ? "Add photos or videos to this collection from any media page." : "No items have been added yet."}</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {collection.items.map((item) => {
              const media = item.photo || item.video;
              if (!media) return null;
              const isPhoto = !!item.photo;
              const href = isPhoto ? `/photo/${(media as any).slug}-${media.id}` : `/video/${(media as any).slug}-${media.id}`;
              return (
                <Link key={item.id} href={href} className="block rounded-xl overflow-hidden group relative break-inside-avoid" style={{ backgroundColor: (item.photo as any)?.dominantColor || "#e5e7eb" }}>
                  <img src={(media as any).thumbnailUrl || (media as any).originalUrl} alt={(media as any).altText || (media as any).title || ""} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  {!isPhoto && (
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-neutral text-white bg-black/50 backdrop-blur-sm">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Video
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
