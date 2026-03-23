import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCloudinaryUploadParams } from "@pixelstock/storage";
import { v4 as uuid } from "uuid";

// POST /api/internal/upload/presign — Get Cloudinary upload params
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

  const mediaType = isVideo ? "videos" : "uploads";
  const folder = `${mediaType}/original/${userId}`;
  const publicId = uuid();
  const resourceType = isVideo ? "video" : "image";

  const params = getCloudinaryUploadParams(folder, publicId, resourceType as "image" | "video");

  return NextResponse.json({
    key: `${folder}/${publicId}`,
    ...params,
  });
}
