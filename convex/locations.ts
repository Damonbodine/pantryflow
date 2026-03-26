import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole, assertLocationAccess } from "./lib/auth";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("Warehouse"), v.literal("Pantry"), v.literal("Mobile"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let locationsQuery;
    if (args.type !== undefined) {
      locationsQuery = ctx.db.query("locations").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else {
      locationsQuery = ctx.db.query("locations").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const locations = await locationsQuery.collect();
    if (args.isActive !== undefined) {
      return locations.filter((l) => l.isActive === args.isActive);
    }
    return locations;
  },
});

export const getById = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const location = await ctx.db.get(args.id);
    if (!location) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return location;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("Warehouse"), v.literal("Pantry"), v.literal("Mobile")),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    phone: v.optional(v.string()),
    operatingHours: v.string(),
    capacityPallets: v.optional(v.number()),
    hasDryStorage: v.boolean(),
    hasRefrigeration: v.boolean(),
    hasFreezer: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const now = Date.now();
    const locationId = await ctx.db.insert("locations", {
      organizationId: currentUser.organizationId,
      name: args.name,
      type: args.type,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      latitude: args.latitude,
      longitude: args.longitude,
      phone: args.phone,
      operatingHours: args.operatingHours,
      capacityPallets: args.capacityPallets,
      hasDryStorage: args.hasDryStorage,
      hasRefrigeration: args.hasRefrigeration,
      hasFreezer: args.hasFreezer,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "locations",
      entityId: locationId,
      details: `Created location ${args.name} (${args.type})`,
      createdAt: now,
    });

    return locationId;
  },
});

export const update = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("Warehouse"), v.literal("Pantry"), v.literal("Mobile"))),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    phone: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
    capacityPallets: v.optional(v.number()),
    hasDryStorage: v.optional(v.boolean()),
    hasRefrigeration: v.optional(v.boolean()),
    hasFreezer: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, args.id);
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
      entityType: "locations",
      entityId: id,
      details: `Updated location fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const deactivate = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Update",
      entityType: "locations",
      entityId: args.id,
      details: `Deactivated location ${existing.name}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
