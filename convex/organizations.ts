import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    const org = await ctx.db.get(currentUser.organizationId);
    if (!org) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return org;
  },
});

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    taxId: v.optional(v.string()),
    defaultVisitFrequencyDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    updates.updatedAt = Date.now();

    await ctx.db.patch(id, updates);

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Update",
      entityType: "organizations",
      entityId: id,
      details: `Updated organization fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});
