import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, assertRole, assertLocationAccess } from "./lib/auth";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("LowStock"), v.literal("CriticalStock"), v.literal("Expired"), v.literal("ExpiringIn3Days"), v.literal("ExpiringIn7Days"), v.literal("ExpiringIn14Days"), v.literal("Overstock"))),
    severity: v.optional(v.union(v.literal("Info"), v.literal("Warning"), v.literal("Critical"))),
    isResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    let alertsQuery;
    if (args.type !== undefined) {
      alertsQuery = ctx.db.query("inventoryAlerts").withIndex("by_type", (q) => q.eq("type", args.type!));
    } else if (args.severity !== undefined) {
      alertsQuery = ctx.db.query("inventoryAlerts").withIndex("by_severity", (q) => q.eq("severity", args.severity!));
    } else if (args.isResolved !== undefined) {
      alertsQuery = ctx.db.query("inventoryAlerts").withIndex("by_isResolved", (q) => q.eq("isResolved", args.isResolved!));
    } else {
      alertsQuery = ctx.db.query("inventoryAlerts").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    let alerts = await alertsQuery.order("desc").take(100);

    if (args.type !== undefined && args.isResolved !== undefined) {
      alerts = alerts.filter((a) => a.isResolved === args.isResolved);
    }
    if (args.severity !== undefined && args.isResolved !== undefined) {
      alerts = alerts.filter((a) => a.isResolved === args.isResolved);
    }

    return alerts;
  },
});

export const listByLocation = query({
  args: {
    locationId: v.id("locations"),
    isResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, args.locationId);
    }

    const alerts = await ctx.db
      .query("inventoryAlerts")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    if (args.isResolved !== undefined) {
      return alerts.filter((a) => a.isResolved === args.isResolved);
    }
    return alerts;
  },
});

export const getById = query({
  args: { id: v.id("inventoryAlerts") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const alert = await ctx.db.get(args.id);
    if (!alert) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return alert;
  },
});

export const resolve = mutation({
  args: { id: v.id("inventoryAlerts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      isResolved: true,
      resolvedById: currentUser._id,
      resolvedAt: now,
    });

    return args.id;
  },
});

export const acknowledge = mutation({
  args: { id: v.id("inventoryAlerts") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    await ctx.db.patch(args.id, { acknowledgedAt: Date.now() });

    return args.id;
  },
});

export const checkExpirations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    const items = await ctx.db.query("inventoryItems").collect();
    for (const item of items) {
      if (!item.expirationDate || item.status === "WrittenOff") continue;
      const daysUntil = item.expirationDate - now;

      let alertType: "Expired" | "ExpiringIn3Days" | "ExpiringIn7Days" | "ExpiringIn14Days" | undefined;
      let severity: "Info" | "Warning" | "Critical" | undefined;

      if (daysUntil <= 0) {
        alertType = "Expired";
        severity = "Critical";
      } else if (daysUntil <= threeDays) {
        alertType = "ExpiringIn3Days";
        severity = "Critical";
      } else if (daysUntil <= sevenDays) {
        alertType = "ExpiringIn7Days";
        severity = "Warning";
      } else if (daysUntil <= fourteenDays) {
        alertType = "ExpiringIn14Days";
        severity = "Info";
      }

      if (!alertType || !severity) continue;

      const existing = await ctx.db
        .query("inventoryAlerts")
        .withIndex("by_inventoryItemId", (q) => q.eq("inventoryItemId", item._id))
        .collect();
      const alreadyAlerted = existing.some((a) => a.type === alertType && !a.isResolved);
      if (alreadyAlerted) continue;

      await ctx.db.insert("inventoryAlerts", {
        organizationId: item.organizationId,
        locationId: item.locationId,
        inventoryItemId: item._id,
        type: alertType,
        severity,
        title: `${alertType === "Expired" ? "Expired" : "Expiring"}: ${item.name}`,
        message: `${item.name} (${item.quantity} ${item.unit}) ${alertType === "Expired" ? "has expired" : "is expiring soon"}.`,
        isResolved: false,
        createdAt: now,
      });
    }
  },
});

export const checkLowStock = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const items = await ctx.db.query("inventoryItems").collect();

    for (const item of items) {
      if (item.status === "WrittenOff" || item.status === "Expired") continue;
      if (item.minStockLevel === undefined) continue;

      let alertType: "LowStock" | "CriticalStock" | undefined;
      let severity: "Warning" | "Critical" | undefined;

      if (item.quantity <= 0) {
        alertType = "CriticalStock";
        severity = "Critical";
      } else if (item.quantity <= item.minStockLevel) {
        alertType = "LowStock";
        severity = "Warning";
      }

      if (!alertType || !severity) continue;

      const existing = await ctx.db
        .query("inventoryAlerts")
        .withIndex("by_inventoryItemId", (q) => q.eq("inventoryItemId", item._id))
        .collect();
      const alreadyAlerted = existing.some((a) => a.type === alertType && !a.isResolved);
      if (alreadyAlerted) continue;

      await ctx.db.insert("inventoryAlerts", {
        organizationId: item.organizationId,
        locationId: item.locationId,
        inventoryItemId: item._id,
        type: alertType,
        severity,
        title: `${alertType === "CriticalStock" ? "Critical Stock" : "Low Stock"}: ${item.name}`,
        message: `${item.name} has ${item.quantity} ${item.unit} remaining (min: ${item.minStockLevel}).`,
        isResolved: false,
        createdAt: now,
      });
    }
  },
});
