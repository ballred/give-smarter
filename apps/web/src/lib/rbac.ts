export const ROLE_KEYS = [
  "ORG_OWNER",
  "ORG_ADMIN",
  "CAMPAIGN_ADMIN",
  "AUCTION_MANAGER",
  "TICKETING_MANAGER",
  "COMMUNICATIONS_MANAGER",
  "VOLUNTEER_CHECKIN",
  "VOLUNTEER_CASHIER",
  "READ_ONLY_ANALYST",
  "FINANCE",
  "API_USER",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const ADMIN_ROLES: RoleKey[] = ["ORG_OWNER", "ORG_ADMIN"];

export function hasRole(userRoles: RoleKey[], required: RoleKey[]) {
  return required.some((role) => userRoles.includes(role));
}
