import { prisma } from "../prisma";

export async function writeAuditLog(input: {
  branchId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      branchId: input.branchId,
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta ?? undefined,
    },
  });
}
