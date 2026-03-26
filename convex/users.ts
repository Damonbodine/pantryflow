import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const list = query({
  args: {
    role: v.optional(v.union(v.literal("Admin"), v.literal("PantryManager"), v.literal("VolunteerLead"), v.literal("Volunteer"), v.literal("ClientServices"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "ClientServices"]);

    let usersQuery;
    if (args.role !== undefined) {
      usersQuery = ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role!));
    } else {
      usersQuery = ctx.db.query("users").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const users = await usersQuery.collect();
    if (args.isActive !== undefined) {
      return users.filter((u) => u.isActive === args.isActive);
    }
    return users;
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return user;
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user;
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("Admin"), v.literal("PantryManager"), v.literal("VolunteerLead"), v.literal("Volunteer"), v.literal("ClientServices"))),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      avatarUrl: args.avatarUrl,
      role: args.role ?? "Volunteer",
      organizationId: args.organizationId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "users",
      entityId: userId,
      details: `Created user ${args.name} with role ${args.role ?? "Volunteer"}`,
      createdAt: now,
    });

    return userId;
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    assignedLocationIds: v.optional(v.array(v.id("locations"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    // Ownership check: non-admin can only update their own profile (excluding assignedLocationIds)
    if (currentUser.role !== "Admin" && currentUser._id !== args.id) {
      throw new Error("UNAUTHORIZED_ROLE: You do not have permission to perform this action.");
    }
    if (currentUser.role !== "Admin" && args.assignedLocationIds !== undefined) {
      throw new Error("UNAUTHORIZED_ROLE: Only Admin can update location assignments.");
    }

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
      entityType: "users",
      entityId: id,
      details: `Updated user fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("Admin"), v.literal("PantryManager"), v.literal("VolunteerLead"), v.literal("Volunteer"), v.literal("ClientServices")),
    assignedLocationIds: v.optional(v.array(v.id("locations"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    const updates: Record<string, unknown> = {
      role: args.role,
      updatedAt: Date.now(),
    };
    if (args.assignedLocationIds !== undefined) {
      updates.assignedLocationIds = args.assignedLocationIds;
    }

    await ctx.db.patch(args.id, updates);

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Update",
      entityType: "users",
      entityId: args.id,
      details: `Changed role from ${target.role} to ${args.role}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const target = await ctx.db.get(args.id);
    if (!target) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Update",
      entityType: "users",
      entityId: args.id,
      details: `Deactivated user ${target.name}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
