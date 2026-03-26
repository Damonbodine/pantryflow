import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const listByRecord = query({
  args: { distributionRecordId: v.id("distributionRecords") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db
      .query("distributionLineItems")
      .withIndex("by_distributionRecordId", (q) => q.eq("distributionRecordId", args.distributionRecordId))
      .collect();
  },
});

export const create = mutation({
  args: {
    distributionRecordId: v.id("distributionRecords"),
    inventoryItemId: v.id("inventoryItems"),
    quantity: v.number(),
    weightLbs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const record = await ctx.db.get(args.distributionRecordId);
    if (!record) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    const distribution = await ctx.db.get(record.distributionId);
    if (!distribution || distribution.status !== "Active") {
      throw new Error("DISTRIBUTION_NOT_ACTIVE: This distribution event is not currently active. Records can only be created or modified during active distributions.");
    }

    const inventoryItem = await ctx.db.get(args.inventoryItemId);
    if (!inventoryItem) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (inventoryItem.status === "Expired" || inventoryItem.status === "WrittenOff") {
      throw new Error("EXPIRED_ITEM_DISTRIBUTION: Expired or written-off items cannot be distributed.");
    }

    if (args.quantity > inventoryItem.quantity) {
      throw new Error("EXCEEDS_AVAILABLE_STOCK: The requested quantity exceeds the available stock for this item.");
    }

    const now = Date.now();
    const lineItemId = await ctx.db.insert("distributionLineItems", {
      distributionRecordId: args.distributionRecordId,
      inventoryItemId: args.inventoryItemId,
      itemName: inventoryItem.name,
      category: inventoryItem.category,
      quantity: args.quantity,
      unit: inventoryItem.unit,
      weightLbs: args.weightLbs,
      createdAt: now,
    });

    const newQuantity = inventoryItem.quantity - args.quantity;
    const newStatus = newQuantity === 0 ? "Critical" :
      (inventoryItem.minStockLevel && newQuantity <= inventoryItem.minStockLevel) ? "Low" :
      inventoryItem.status;

    await ctx.db.patch(args.inventoryItemId, {
      quantity: newQuantity,
      status: newStatus,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Distribute",
      entityType: "distributionLineItems",
      entityId: lineItemId,
      details: `Distributed ${args.quantity} ${inventoryItem.unit} of ${inventoryItem.name}`,
      locationId: distribution.locationId,
      createdAt: now,
    });

    return lineItemId;
  },
});

export const delete_ = mutation({
  args: { id: v.id("distributionLineItems") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead"]);

    const lineItem = await ctx.db.get(args.id);
    if (!lineItem) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    const record = await ctx.db.get(lineItem.distributionRecordId);
    if (record) {
      const distribution = await ctx.db.get(record.distributionId);
      if (!distribution || distribution.status !== "Active") {
        throw new Error("DISTRIBUTION_NOT_ACTIVE: This distribution event is not currently active. Records can only be created or modified during active distributions.");
      }
    }

    const inventoryItem = await ctx.db.get(lineItem.inventoryItemId);
    if (inventoryItem) {
      await ctx.db.patch(lineItem.inventoryItemId, {
        quantity: inventoryItem.quantity + lineItem.quantity,
        status: "InStock",
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.id);

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Delete",
      entityType: "distributionLineItems",
      entityId: args.id,
      details: `Removed line item: ${lineItem.quantity} ${lineItem.unit} of ${lineItem.itemName}. Inventory restored.`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
