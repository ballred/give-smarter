import { auth as clerkAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { ROLE_KEYS, hasRole, type RoleKey } from "@/lib/rbac";

type AdminAuthOptions = {
  requiredRoles?: RoleKey[];
  orgId?: string;
};

export type AdminAuthResult = {
  userId: string | null;
  appUserId?: string;
  orgId?: string;
  roles: RoleKey[];
};

function unauthorized(): AdminAuthResult {
  return {
    userId: null,
    appUserId: undefined,
    orgId: undefined,
    roles: [],
  };
}

function isRoleKey(value: string): value is RoleKey {
  return (ROLE_KEYS as readonly string[]).includes(value);
}

export async function auth(options: AdminAuthOptions = {}): Promise<AdminAuthResult> {
  const session = await clerkAuth();

  if (!session.userId) {
    return unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: session.userId },
    include: {
      roleAssignments: {
        include: {
          role: {
            select: { key: true },
          },
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return unauthorized();
  }

  const roles = user.roleAssignments
    .map((assignment) => assignment.role.key)
    .filter(isRoleKey);

  if (!roles.length) {
    return unauthorized();
  }

  if (options.orgId && user.orgId !== options.orgId) {
    return unauthorized();
  }

  if (options.requiredRoles?.length && !hasRole(roles, options.requiredRoles)) {
    return unauthorized();
  }

  return {
    userId: session.userId,
    appUserId: user.id,
    orgId: user.orgId,
    roles,
  };
}
