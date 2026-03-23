import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invalidateFeeds, invalidatePhotoDetail } from "@/lib/cache";

/**
 * DELETE /api/internal/photos/[id]
 *
 * Allows the photo owner (or an admin) to delete their uploaded photo.
 * Cascading deletes handle tags, likes, downloads, and collection items.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).isAdmin === true;

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { id: true, userId: true, cdnKey: true, originalUrl: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    if (photo.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related records first (those without cascading deletes)
    await prisma.photoTag.deleteMany({ where: { photoId: id } });
    await prisma.like.deleteMany({ where: { mediaType: "photo", mediaId: id } });
    await prisma.download.deleteMany({ where: { mediaType: "photo", mediaId: id } });
    await prisma.collectionItem.deleteMany({ where: { mediaType: "photo", mediaId: id } });

    // Delete the photo record
    await prisma.photo.delete({ where: { id } });

    await invalidateFeeds();
    await invalidatePhotoDetail(id);

    // Try to delete from Cloudinary (non-blocking)
    try {
      if (photo.cdnKey || photo.originalUrl?.includes("res.cloudinary.com")) {
        const { deleteFromCloudinary } = await import("@nepalens/storage");
        if (photo.cdnKey) {
          await deleteFromCloudinary(photo.cdnKey);
        }
      }
    } catch (storageErr) {
      console.error("Failed to delete from storage (non-blocking):", storageErr);
    }

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    console.error("Photo delete error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}
