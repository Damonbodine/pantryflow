import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole, assertLocationAccess } from "./lib/auth";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("Scheduled"), v.literal("Active"), v.literal("Completed"), v.literal("Cancelled"))),
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let distQuery;
    if (args.locationId !== undefined) {
      distQuery = ctx.db.query("distributions").withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!));
    } else if (args.status !== undefined) {
      distQuery = ctx.db.query("distributions").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      distQuery = ctx.db.query("distributions").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const distributions = await distQuery.order("desc").take(100);

    if (args.status !== undefined && args.locationId !== undefined) {
      return distributions.filter((d) => d.status === args.status);
    }
    return distributions;
  },
});

export const listUpcoming = query({
  args: { locationId: v.optional(v.id("locations")) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const now = Date.now();
    let distributions;
    if (args.locationId !== undefined) {
      distributions = await ctx.db
        .query("distributions")
        .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!))
        .collect();
    } else {
      distributions = await ctx.db
        .query("distributions")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();
    }

    return distributions
      .filter((d) => (d.status === "Scheduled" || d.status === "Active") && d.scheduledDate >= now)
      .sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

export const getById = query({
  args: { id: v.id("distributions") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const distribution = await ctx.db.get(args.id);
    if (!distribution) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return distribution;
  },
});

export const create = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.string(),
    type: v.union(v.literal("WalkIn"), v.literal("DriveThrough"), v.literal("Delivery"), v.literal("PopUp")),
    scheduledDate: v.number(),
    endTime: v.optional(v.number()),
    assignedStaffIds: v.array(v.id("users")),
    leadId: v.id("users"),
    estimatedClients: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const location = await ctx.db.get(args.locationId);
    if (!location || !location.isActive) {
      throw new Error("INACTIVE_LOCATION: This location is currently inactive and cannot receive donations or host distributions.");
    }

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, args.locationId);
    }

    const now = Date.now();
    const distId = await ctx.db.insert("distributions", {
      organizationId: currentUser.organizationId,
      locationId: args.locationId,
      name: args.name,
      type: args.type,
      scheduledDate: args.scheduledDate,
      endTime: args.endTime,
      status: "Scheduled",
      assignedStaffIds: args.assignedStaffIds,
      leadId: args.leadId,
      estimatedClients: args.estimatedClients,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "distributions",
      entityId: distId,
      details: `Scheduled distribution ${args.name} (${args.type})`,
      locationId: args.locationId,
      createdAt: now,
    });

    return distId;
  },
});

export const update = mutation({
  args: {
    id: v.id("distributions"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("WalkIn"), v.literal("DriveThrough"), v.literal("Delivery"), v.literal("PopUp"))),
    scheduledDate: v.optional(v.number()),
    endTime: v.optional(v.number()),
    assignedStaffIds: v.optional(v.array(v.id("users"))),
    leadId: v.optional(v.id("users")),
    estimatedClients: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "VolunteerLead" && existing.leadId !== currentUser._id) {
      throw new Error("UNAUTHORIZED_ROLE: You do not have permission to perform this action.");
    }
    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
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
      entityType: "distributions",
      entityId: id,
      details: `Updated distribution fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      locationId: existing.locationId,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("distributions"),
    status: v.union(v.literal("Scheduled"), v.literal("Active"), v.literal("Completed"), v.literal("Cancelled")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    const validTransitions: Record<string, string[]> = {
      Scheduled: ["Active", "Cancelled"],
      Active: ["Completed", "Cancelled"],
      Completed: [],
      Cancelled: [],
    };
    if (!validTransitions[existing.status]?.includes(args.status)) {
      throw new Error("INVALID_STATUS_TRANSITION: The requested status transition is not allowed from the current state.");
    }

    if (args.status === "Active") {
      if (existing.assignedStaffIds.length === 0) {
        throw new Error("MISSING_STAFF_ASSIGNMENT: A distribution cannot be activated without at least one assigned staff member and a valid lead.");
      }
      const lead = await ctx.db.get(existing.leadId);
      if (!lead) {
        throw new Error("MISSING_STAFF_ASSIGNMENT: A distribution cannot be activated without at least one assigned staff member and a valid lead.");
      }
    }

    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "StatusChange",
      entityType: "distributions",
      entityId: args.id,
      details: `Status changed from ${existing.status} to ${args.status}`,
      locationId: existing.locationId,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

export const complete = mutation({
  args: { id: v.id("distributions") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (existing.status !== "Active") {
      throw new Error("INVALID_STATUS_TRANSITION: The requested status transition is not allowed from the current state.");
    }

    const records = await ctx.db
      .query("distributionRecords")
      .withIndex("by_distributionId", (q) => q.eq("distributionId", args.id))
      .collect();

    const fulfilledRecords = records.filter((r) => r.status === "Fulfilled");
    let totalWeight = 0;
    let totalItems = 0;

    for (const record of fulfilledRecords) {
      const lineItems = await ctx.db
        .query("distributionLineItems")
        .withIndex("by_distributionRecordId", (q) => q.eq("distributionRecordId", record._id))
        .collect();
      for (const li of lineItems) {
        totalWeight += li.weightLbs ?? 0;
        totalItems += li.quantity;
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "Completed",
      actualClients: fulfilledRecords.length,
      totalWeightDistributed: totalWeight,
      totalItemsDistributed: totalItems,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "StatusChange",
      entityType: "distributions",
      entityId: args.id,
      details: `Completed distribution. Served ${fulfilledRecords.length} clients, ${totalWeight} lbs distributed`,
      locationId: existing.locationId,
      createdAt: now,
    });

    return args.id;
  },
});
