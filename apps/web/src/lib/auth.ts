import { auth } from "@clerk/nextjs/server";
import type { RoleKey } from "./rbac";

export type SessionUser = {
  userId: string;
  roles: RoleKey[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return {
    userId,
    roles: [],
  };
}
