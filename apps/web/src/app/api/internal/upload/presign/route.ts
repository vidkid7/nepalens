import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPresignedUploadUrl } from "@pixelstock/storage";
import { v4 as uuid } from "uuid";

// POST /api/internal/upload/presign — Get presigned S3 URL
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { contentType, filename } = body;

  if (!contentType || !contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const ext = filename?.split(".").pop() || "jpg";
  const key = `uploads/original/${userId}/${uuid()}.${ext}`;

  const url = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ key, url });
}
