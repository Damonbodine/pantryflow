import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const listByDistribution = query({
  args: {
    distributionId: v.id("distributions"),
    status: v.optional(v.union(v.literal("CheckedIn"), v.literal("InProgress"), v.literal("Fulfilled"), v.literal("NoShow"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const records = await ctx.db
      .query("distributionRecords")
      .withIndex("by_distributionId", (q) => q.eq("distributionId", args.distributionId))
      .collect();

    const results = await Promise.all(
      records.map(async (record) => {
        const client = await ctx.db.get(record.clientId);
        return {
          ...record,
          clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        };
      })
    );

    if (args.status !== undefined) {
      return results.filter((r) => r.status === args.status);
    }
    return results;
  },
});

export const getById = query({
  args: { id: v.id("distributionRecords") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const record = await ctx.db.get(args.id);
    if (!record) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return record;
  },
});

export const checkIn = mutation({
  args: {
    distributionId: v.id("distributions"),
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const distribution = await ctx.db.get(args.distributionId);
    if (!distribution || distribution.status !== "Active") {
      throw new Error("DISTRIBUTION_NOT_ACTIVE: This distribution event is not currently active. Records can only be created or modified during active distributions.");
    }

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    if (client.eligibilityStatus !== "Eligible") {
      throw new Error("CLIENT_INELIGIBLE: This client is not currently eligible for distribution services. Their eligibility status must be 'Eligible' to check in.");
    }

    if (client.lastVisitAt) {
      const org = await ctx.db.get(currentUser.organizationId);
      const frequencyDays = client.visitFrequencyOverrideDays ?? org?.defaultVisitFrequencyDays ?? 14;
      const minInterval = frequencyDays * 24 * 60 * 60 * 1000;
      if (Date.now() - client.lastVisitAt < minInterval) {
        throw new Error("VISIT_FREQUENCY_VIOLATION: This client has visited too recently and is not yet eligible for another distribution.");
      }
    }

    const now = Date.now();
    const recordId = await ctx.db.insert("distributionRecords", {
      distributionId: args.distributionId,
      clientId: args.clientId,
      checkedInById: currentUser._id,
      checkedInAt: now,
      householdSizeAtVisit: client.householdSize,
      dietaryRestrictionsAtVisit: client.dietaryRestrictions,
      status: "CheckedIn",
      createdAt: now,
    });

    await ctx.db.patch(args.clientId, { lastVisitAt: now, updatedAt: now });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "CheckIn",
      entityType: "distributionRecords",
      entityId: recordId,
      details: `Checked in ${client.firstName} ${client.lastName} (household: ${client.householdSize})`,
      locationId: distribution.locationId,
      createdAt: now,
    });

    return recordId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("distributionRecords"),
    status: v.union(v.literal("CheckedIn"), v.literal("InProgress"), v.literal("Fulfilled"), v.literal("NoShow")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "Volunteer") {
      const distribution = await ctx.db.get(existing.distributionId);
      if (!distribution || distribution.status !== "Active") {
        throw new Error("DISTRIBUTION_NOT_ACTIVE: This distribution event is not currently active. Records can only be created or modified during active distributions.");
      }
    }

    const validTransitions: Record<string, string[]> = {
      CheckedIn: ["InProgress", "NoShow"],
      InProgress: ["Fulfilled", "NoShow"],
      Fulfilled: [],
      NoShow: [],
    };
    if (!validTransitions[existing.status]?.includes(args.status)) {
      throw new Error("INVALID_STATUS_TRANSITION: The requested status transition is not allowed from the current state.");
    }

    await ctx.db.patch(args.id, { status: args.status });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "StatusChange",
      entityType: "distributionRecords",
      entityId: args.id,
      details: `Record status changed from ${existing.status} to ${args.status}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

export const fulfill = mutation({
  args: { id: v.id("distributionRecords") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (existing.status !== "InProgress") {
      throw new Error("INVALID_STATUS_TRANSITION: The requested status transition is not allowed from the current state.");
    }

    const distribution = await ctx.db.get(existing.distributionId);
    if (!distribution || distribution.status !== "Active") {
      throw new Error("DISTRIBUTION_NOT_ACTIVE: This distribution event is not currently active. Records can only be created or modified during active distributions.");
    }

    const lineItems = await ctx.db
      .query("distributionLineItems")
      .withIndex("by_distributionRecordId", (q) => q.eq("distributionRecordId", args.id))
      .collect();
    if (lineItems.length === 0) {
      throw new Error("INVALID_STATUS_TRANSITION: Cannot fulfill a record with no line items.");
    }

    let totalWeight = 0;
    for (const li of lineItems) {
      totalWeight += li.weightLbs ?? 0;
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "Fulfilled",
      fulfilledById: currentUser._id,
      fulfilledAt: now,
      totalWeightLbs: totalWeight,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Distribute",
      entityType: "distributionRecords",
      entityId: args.id,
      details: `Fulfilled distribution record with ${lineItems.length} items, ${totalWeight} lbs`,
      locationId: distribution.locationId,
      createdAt: now,
    });

    return args.id;
  },
});
