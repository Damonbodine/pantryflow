import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const list = query({
  args: {
    action: v.optional(v.union(v.literal("Create"), v.literal("Update"), v.literal("Delete"), v.literal("StatusChange"), v.literal("WriteOff"), v.literal("Transfer"), v.literal("CheckIn"), v.literal("Distribute"), v.literal("Login"))),
    locationId: v.optional(v.id("locations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    let logsQuery;
    if (args.action !== undefined) {
      logsQuery = ctx.db.query("auditLogs").withIndex("by_action", (q) => q.eq("action", args.action!));
    } else if (args.locationId !== undefined) {
      logsQuery = ctx.db.query("auditLogs").withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!));
    } else {
      logsQuery = ctx.db.query("auditLogs").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const logs = await logsQuery.order("desc").take(args.limit ?? 100);

    const results = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return { ...log, userName: user?.name ?? "Unknown" };
      })
    );

    return results;
  },
});

export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entityType", (q) => q.eq("entityType", args.entityType))
      .collect();

    const filtered = logs.filter((l) => l.entityId === args.entityId);
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const results = await Promise.all(
      filtered.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return { ...log, userName: user?.name ?? "Unknown" };
      })
    );

    return results;
  },
});
