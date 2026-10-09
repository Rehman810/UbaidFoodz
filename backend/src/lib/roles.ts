import { Role } from "@prisma/client";

export const STAFF_DIRECTORY_ROLES: Role[] = [
  Role.ADMIN,
  Role.MANAGER,
  Role.CHEF,
  Role.RIDER,
  Role.CASHIER,
];

export const ADMIN_LIKE: Role[] = [Role.ADMIN, Role.MANAGER];

export const ORDER_OPS: Role[] = [Role.ADMIN, Role.MANAGER, Role.CHEF, Role.CASHIER];
