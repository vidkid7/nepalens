import { prisma } from "@nepalens/database";

export async function logAuditEvent({
  userId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
}: {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details: details || {},
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
