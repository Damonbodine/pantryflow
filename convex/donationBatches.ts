import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole, assertLocationAccess } from "./lib/auth";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("Received"), v.literal("Processing"), v.literal("Shelved"), v.literal("Rejected"))),
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    let batchesQuery;
    if (args.locationId !== undefined) {
      batchesQuery = ctx.db.query("donationBatches").withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!));
    } else if (args.status !== undefined) {
      batchesQuery = ctx.db.query("donationBatches").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      batchesQuery = ctx.db.query("donationBatches").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const batches = await batchesQuery.order("desc").take(100);

    const results = await Promise.all(
      batches.map(async (batch) => {
        const donor = await ctx.db.get(batch.donorId);
        return { ...batch, donorName: donor?.name ?? "Unknown" };
      })
    );

    if (args.status !== undefined && args.locationId !== undefined) {
      return results.filter((b) => b.status === args.status);
    }
    return results;
  },
});

export const listByDonor = query({
  args: { donorId: v.id("donors") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    return await ctx.db
      .query("donationBatches")
      .withIndex("by_donorId", (q) => q.eq("donorId", args.donorId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("donationBatches") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const batch = await ctx.db.get(args.id);
    if (!batch) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    const donor = await ctx.db.get(batch.donorId);
    const location = await ctx.db.get(batch.locationId);
    const receivedBy = await ctx.db.get(batch.receivedById);

    return {
      ...batch,
      donorName: donor?.name ?? "Unknown",
      locationName: location?.name ?? "Unknown",
      receivedByName: receivedBy?.name ?? "Unknown",
    };
  },
});

export const create = mutation({
  args: {
    donorId: v.id("donors"),
    locationId: v.id("locations"),
    receivedAt: v.number(),
    totalWeightLbs: v.number(),
    itemCount: v.number(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Fair"), v.literal("NearExpiry")),
    storageAssignment: v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen"), v.literal("Mixed")),
    temperatureVerified: v.boolean(),
    notes: v.optional(v.string()),
    receiptPhotoUrl: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    items: v.array(v.object({
      name: v.string(),
      category: v.union(v.literal("Produce"), v.literal("Dairy"), v.literal("Protein"), v.literal("Grains"), v.literal("Canned"), v.literal("Beverages"), v.literal("Snacks"), v.literal("PreparedMeals"), v.literal("HygieneNonFood"), v.literal("Baby"), v.literal("Other")),
      quantity: v.number(),
      unit: v.union(v.literal("Pounds"), v.literal("Ounces"), v.literal("Cans"), v.literal("Boxes"), v.literal("Bags"), v.literal("Cases"), v.literal("Gallons"), v.literal("Items"), v.literal("Pallets")),
      storageType: v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen")),
      expirationDate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const location = await ctx.db.get(args.locationId);
    if (!location || !location.isActive) {
      throw new Error("INACTIVE_LOCATION: This location is currently inactive and cannot receive donations or host distributions.");
    }

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, args.locationId);
    }

    const now = Date.now();
    const batchId = await ctx.db.insert("donationBatches", {
      organizationId: currentUser.organizationId,
      donorId: args.donorId,
      locationId: args.locationId,
      receivedById: currentUser._id,
      receivedAt: args.receivedAt,
      totalWeightLbs: args.totalWeightLbs,
      itemCount: args.itemCount,
      condition: args.condition,
      storageAssignment: args.storageAssignment,
      temperatureVerified: args.temperatureVerified,
      notes: args.notes,
      receiptPhotoUrl: args.receiptPhotoUrl,
      donorThankYouSent: false,
      estimatedValue: args.estimatedValue,
      status: "Received",
      createdAt: now,
    });

    for (const item of args.items) {
      await ctx.db.insert("inventoryItems", {
        organizationId: currentUser.organizationId,
        locationId: args.locationId,
        donationBatchId: batchId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        storageType: item.storageType,
        expirationDate: item.expirationDate,
        status: "InStock",
        createdAt: now,
        updatedAt: now,
      });
    }

    const donor = await ctx.db.get(args.donorId);
    if (donor) {
      await ctx.db.patch(args.donorId, {
        totalDonationsCount: donor.totalDonationsCount + 1,
        totalDonationsWeight: donor.totalDonationsWeight + args.totalWeightLbs,
        lastDonationAt: args.receivedAt,
      });
    }

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "donationBatches",
      entityId: batchId,
      details: `Received donation batch: ${args.totalWeightLbs} lbs, ${args.itemCount} items`,
      locationId: args.locationId,
      createdAt: now,
    });

    return batchId;
  },
});

export const update = mutation({
  args: {
    id: v.id("donationBatches"),
    condition: v.optional(v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Fair"), v.literal("NearExpiry"))),
    storageAssignment: v.optional(v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen"), v.literal("Mixed"))),
    temperatureVerified: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    receiptPhotoUrl: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    donorThankYouSent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

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
      entityType: "donationBatches",
      entityId: id,
      details: `Updated batch fields: ${Object.keys(updates).join(", ")}`,
      locationId: existing.locationId,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("donationBatches"),
    status: v.union(v.literal("Received"), v.literal("Processing"), v.literal("Shelved"), v.literal("Rejected")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    const validTransitions: Record<string, string[]> = {
      Received: ["Processing", "Rejected"],
      Processing: ["Shelved", "Rejected"],
      Shelved: [],
      Rejected: [],
    };
    if (!validTransitions[existing.status]?.includes(args.status)) {
      throw new Error("INVALID_STATUS_TRANSITION: The requested status transition is not allowed from the current state.");
    }

    await ctx.db.patch(args.id, { status: args.status });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "StatusChange",
      entityType: "donationBatches",
      entityId: args.id,
      details: `Status changed from ${existing.status} to ${args.status}`,
      locationId: existing.locationId,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
