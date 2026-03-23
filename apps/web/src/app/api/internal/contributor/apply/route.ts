import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@nepalens/database";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isContributor: true, isBanned: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "Account is suspended" },
        { status: 403 },
      );
    }

    if (user.isContributor) {
      return NextResponse.json(
        { error: "Already a contributor" },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isContributor: true },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: "contributor.apply",
          targetType: "user",
          targetId: userId,
          details: { source: "contribute_page" },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contributor/apply] Error:", error);
    return NextResponse.json(
      { error: "Failed to enable contributor mode" },
      { status: 500 },
    );
  }
}
