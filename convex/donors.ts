import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("GroceryStore"), v.literal("Restaurant"), v.literal("Farm"), v.literal("Individual"), v.literal("FoodBank"), v.literal("Corporation"), v.literal("FoodDrive"), v.literal("Government"), v.literal("Other"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    let donorsQuery;
    if (args.type !== undefined) {
      donorsQuery = ctx.db.query("donors").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else {
      donorsQuery = ctx.db.query("donors").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const donors = await donorsQuery.collect();
    if (args.isActive !== undefined) {
      return donors.filter((d) => d.isActive === args.isActive);
    }
    return donors;
  },
});

export const getById = query({
  args: { id: v.id("donors") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);
    const donor = await ctx.db.get(args.id);
    if (!donor) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return donor;
  },
});

export const listTopDonors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const donors = await ctx.db
      .query("donors")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    const activeDonors = donors.filter((d) => d.isActive);
    activeDonors.sort((a, b) => b.totalDonationsWeight - a.totalDonationsWeight);
    return activeDonors.slice(0, args.limit ?? 10);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("GroceryStore"), v.literal("Restaurant"), v.literal("Farm"), v.literal("Individual"), v.literal("FoodBank"), v.literal("Corporation"), v.literal("FoodDrive"), v.literal("Government"), v.literal("Other")),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const now = Date.now();
    const donorId = await ctx.db.insert("donors", {
      organizationId: currentUser.organizationId,
      name: args.name,
      type: args.type,
      contactName: args.contactName,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      preferredCategories: args.preferredCategories,
      totalDonationsCount: 0,
      totalDonationsWeight: 0,
      isActive: true,
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "donors",
      entityId: donorId,
      details: `Created donor ${args.name} (${args.type})`,
      createdAt: now,
    });

    return donorId;
  },
});

export const update = mutation({
  args: {
    id: v.id("donors"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("GroceryStore"), v.literal("Restaurant"), v.literal("Farm"), v.literal("Individual"), v.literal("FoodBank"), v.literal("Corporation"), v.literal("FoodDrive"), v.literal("Government"), v.literal("Other"))),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

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
      entityType: "donors",
      entityId: id,
      details: `Updated donor fields: ${Object.keys(updates).join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});
