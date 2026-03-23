import { NextResponse } from "next/server";
import { prisma } from "@nepalens/database";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "connected", url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message, url: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') }, { status: 500 });
  }
}
