import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invalidateFeeds } from "@/lib/cache";

/**
 * DELETE /api/internal/videos/[id]
 *
 * Allows the video owner (or an admin) to delete their uploaded video.
 * Cascading deletes handle files, tags, likes, downloads, and collection items.
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

    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, userId: true, files: { select: { cdnUrl: true } } },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    if (video.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete related records first
    await prisma.videoFile.deleteMany({ where: { videoId: id } });
    await prisma.videoTag.deleteMany({ where: { videoId: id } });
    await prisma.like.deleteMany({ where: { mediaType: "video", mediaId: id } });
    await prisma.download.deleteMany({ where: { mediaType: "video", mediaId: id } });
    await prisma.collectionItem.deleteMany({ where: { mediaType: "video", mediaId: id } });

    // Delete the video record
    await prisma.video.delete({ where: { id } });

    await invalidateFeeds();

    // Try to delete from Cloudinary (non-blocking)
    try {
      for (const file of video.files) {
        if (file.cdnUrl?.includes("res.cloudinary.com")) {
          const { deleteFromCloudinary } = await import("@nepalens/storage");
          // Extract key from Cloudinary URL
          const match = file.cdnUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
          if (match) {
            await deleteFromCloudinary(match[1]);
          }
        }
      }
    } catch (storageErr) {
      console.error("Failed to delete from storage (non-blocking):", storageErr);
    }

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    console.error("Video delete error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
