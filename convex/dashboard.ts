import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const getInventoryStats = query({
  args: { locationId: v.optional(v.id("locations")) },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let items;
    if (args.locationId !== undefined) {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!))
        .collect();
    } else {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();
    }

    const activeItems = items.filter((i) => i.status !== "WrittenOff");
    const totalQuantity = activeItems.reduce((sum, i) => sum + i.quantity, 0);
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byStorageType: Record<string, number> = {};

    for (const item of activeItems) {
      byCategory[item.category] = (byCategory[item.category] ?? 0) + item.quantity;
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byStorageType[item.storageType] = (byStorageType[item.storageType] ?? 0) + item.quantity;
    }

    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expiringIn3Days = activeItems.filter((i) => i.expirationDate && i.expirationDate <= now + threeDays && i.expirationDate > now).length;
    const expiringIn7Days = activeItems.filter((i) => i.expirationDate && i.expirationDate <= now + sevenDays && i.expirationDate > now).length;
    const expired = activeItems.filter((i) => i.expirationDate && i.expirationDate <= now).length;

    return {
      totalItems: activeItems.length,
      totalQuantity,
      byCategory,
      byStatus,
      byStorageType,
      expiringIn3Days,
      expiringIn7Days,
      expired,
    };
  },
});

export const getWasteStats = query({
  args: {
    locationId: v.optional(v.id("locations")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let items;
    if (args.locationId !== undefined) {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!))
        .collect();
    } else {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();
    }

    let writtenOff = items.filter((i) => i.status === "WrittenOff");

    if (args.startDate !== undefined) {
      writtenOff = writtenOff.filter((i) => (i.writeOffDate ?? i.createdAt) >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      writtenOff = writtenOff.filter((i) => (i.writeOffDate ?? i.createdAt) <= args.endDate!);
    }

    const byReason: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalWastedQuantity = 0;

    for (const item of writtenOff) {
      const reason = item.writeOffReason ?? "Other";
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      byCategory[item.category] = (byCategory[item.category] ?? 0) + item.quantity;
      totalWastedQuantity += item.quantity;
    }

    return {
      totalWrittenOff: writtenOff.length,
      totalWastedQuantity,
      byReason,
      byCategory,
    };
  },
});

export const getImpactStats = query({
  args: {
    locationId: v.optional(v.id("locations")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

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

    let completed = distributions.filter((d) => d.status === "Completed");
    if (args.startDate !== undefined) {
      completed = completed.filter((d) => d.scheduledDate >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      completed = completed.filter((d) => d.scheduledDate <= args.endDate!);
    }

    const totalDistributions = completed.length;
    const totalClientsServed = completed.reduce((sum, d) => sum + (d.actualClients ?? 0), 0);
    const totalWeightDistributed = completed.reduce((sum, d) => sum + (d.totalWeightDistributed ?? 0), 0);
    const totalItemsDistributed = completed.reduce((sum, d) => sum + (d.totalItemsDistributed ?? 0), 0);

    let donations;
    if (args.locationId !== undefined) {
      donations = await ctx.db
        .query("donationBatches")
        .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!))
        .collect();
    } else {
      donations = await ctx.db
        .query("donationBatches")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
        .collect();
    }

    if (args.startDate !== undefined) {
      donations = donations.filter((d) => d.receivedAt >= args.startDate!);
    }
    if (args.endDate !== undefined) {
      donations = donations.filter((d) => d.receivedAt <= args.endDate!);
    }

    const totalDonations = donations.length;
    const totalDonationWeight = donations.reduce((sum, d) => sum + d.totalWeightLbs, 0);

    return {
      totalDistributions,
      totalClientsServed,
      totalWeightDistributed,
      totalItemsDistributed,
      totalDonations,
      totalDonationWeight,
    };
  },
});
