import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/internal/notifications — Get user notifications
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ notifications: [] });
  }

  // For now return empty notifications — the infrastructure is ready
  // to be connected to a real notifications table when needed
  return NextResponse.json({ notifications: [] });
}
