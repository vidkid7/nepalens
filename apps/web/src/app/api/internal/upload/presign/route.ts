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

  const isImage = contentType && contentType.startsWith("image/");
  const isVideo = contentType && contentType.startsWith("video/");

  if (!contentType || (!isImage && !isVideo)) {
    return NextResponse.json({ error: "Invalid content type. Only images and videos are allowed." }, { status: 400 });
  }

  const ext = filename?.split(".").pop() || (isVideo ? "mp4" : "jpg");
  const mediaType = isVideo ? "videos" : "uploads";
  const key = `${mediaType}/original/${userId}/${uuid()}.${ext}`;

  const url = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ key, url });
}
