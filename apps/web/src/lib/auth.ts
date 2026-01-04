import { auth } from "@clerk/nextjs/server";
import type { RoleKey } from "./rbac";

export type SessionUser = {
  userId: string;
  roles: RoleKey[];
};

export function getSessionUser(): SessionUser | null {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  return {
    userId,
    roles: [],
  };
}
