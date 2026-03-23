import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { cacheDel, isRedisConnected } from "@/lib/cache";

export const dynamic = "force-dynamic";

/* ── GET: health checks + stats ──────────────────────────────────── */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const health: Record<string, { status: string; detail: string }> = {};

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = { status: "healthy", detail: "Connected" };
  } catch {
    health.database = { status: "offline", detail: "Connection failed" };
  }

  // Redis
  health.cache = isRedisConnected()
    ? { status: "healthy", detail: "Connected" }
    : { status: "degraded", detail: "Using in-memory fallback" };

  // Storage (Cloudinary — check env)
  health.storage = process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME
    ? { status: "healthy", detail: "Configured" }
    : { status: "unknown", detail: "Not configured" };

  // Email
  health.email = process.env.SMTP_HOST || process.env.EMAIL_SERVER
    ? { status: "healthy", detail: "Configured" }
    : { status: "unknown", detail: "Not configured" };

  return NextResponse.json({ health });
}

/* ── POST: danger zone actions ───────────────────────────────────── */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminUserId = (session.user as any).id;
  const { action } = await request.json();

  switch (action) {
    case "clear-caches": {
      await cacheDel("photos:*");
      await cacheDel("home:*");
      await cacheDel("discover:*");
      await cacheDel("autocomplete:*");
      await cacheDel("leaderboard:*");
      await cacheDel("user:*");
      await cacheDel("collection:*");

      await logAuditEvent({
        userId: adminUserId,
        action: "settings.clear_caches",
        targetType: "system",
        targetId: "all",
        details: { note: "All caches cleared" },
      });

      return NextResponse.json({ message: "All caches cleared" });
    }

    case "reprocess-failed": {
      const updated = await prisma.photo.updateMany({
        where: { status: "processing_failed" },
        data: { status: "pending_review" },
      });
      const updatedVideos = await prisma.video.updateMany({
        where: { status: "processing_failed" },
        data: { status: "pending_review" },
      });

      await logAuditEvent({
        userId: adminUserId,
        action: "settings.reprocess_failed",
        targetType: "system",
        targetId: "all",
        details: {
          photosRequeued: updated.count,
          videosRequeued: updatedVideos.count,
        },
      });

      return NextResponse.json({
        message: `Requeued ${updated.count} photos and ${updatedVideos.count} videos`,
      });
    }

    case "purge-audit": {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const deleted = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });

      await logAuditEvent({
        userId: adminUserId,
        action: "settings.purge_audit_logs",
        targetType: "system",
        targetId: "all",
        details: { deletedCount: deleted.count, cutoffDate: cutoff.toISOString() },
      });

      return NextResponse.json({
        message: `Purged ${deleted.count} audit log entries older than 90 days`,
      });
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
