import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED: You must be logged in to perform this action.");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("ENTITY_NOT_FOUND: User record not found for authenticated identity.");
  return user;
}

export function assertRole(user: Doc<"users">, allowedRoles: string[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error("UNAUTHORIZED_ROLE: You do not have permission to perform this action.");
  }
}

export function assertLocationAccess(user: Doc<"users">, locationId: string): void {
  if (user.role === "Admin") return;
  const assigned = user.assignedLocationIds ?? [];
  if (!assigned.some((id) => id === locationId)) {
    throw new Error("LOCATION_NOT_ASSIGNED: You are not assigned to this location and cannot perform operations on its records.");
  }
}
