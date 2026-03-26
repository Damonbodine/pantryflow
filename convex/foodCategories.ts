import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const list = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let categories;
    if (args.isActive !== undefined) {
      categories = await ctx.db
        .query("foodCategories")
        .withIndex("by_isActive", (q) => q.eq("isActive", args.isActive!))
        .collect();
    } else {
      categories = await ctx.db
        .query("foodCategories")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();
    }

    categories.sort((a, b) => a.sortOrder - b.sortOrder);
    return categories;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const now = Date.now();
    const categoryId = await ctx.db.insert("foodCategories", {
      organizationId: currentUser.organizationId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      sortOrder: args.sortOrder,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "foodCategories",
      entityId: categoryId,
      details: `Created food category ${args.name}`,
      createdAt: now,
    });

    return categoryId;
  },
});

export const update = mutation({
  args: {
    id: v.id("foodCategories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
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

    await ctx.db.patch(id, updates);

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Update",
      entityType: "foodCategories",
      entityId: id,
      details: `Updated food category fields: ${Object.keys(updates).join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const delete_ = mutation({
  args: { id: v.id("foodCategories") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Delete",
      entityType: "foodCategories",
      entityId: args.id,
      details: `Deleted food category ${existing.name}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
