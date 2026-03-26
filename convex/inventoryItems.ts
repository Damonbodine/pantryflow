import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, assertRole, assertLocationAccess } from "./lib/auth";

export const list = query({
  args: {
    category: v.optional(v.union(v.literal("Produce"), v.literal("Dairy"), v.literal("Protein"), v.literal("Grains"), v.literal("Canned"), v.literal("Beverages"), v.literal("Snacks"), v.literal("PreparedMeals"), v.literal("HygieneNonFood"), v.literal("Baby"), v.literal("Other"))),
    storageType: v.optional(v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen"))),
    status: v.optional(v.union(v.literal("InStock"), v.literal("Low"), v.literal("Critical"), v.literal("Expired"), v.literal("WrittenOff"))),
    locationId: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    let itemsQuery;
    if (args.locationId !== undefined) {
      itemsQuery = ctx.db.query("inventoryItems").withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!));
    } else if (args.category !== undefined) {
      itemsQuery = ctx.db.query("inventoryItems").withIndex("by_category", (q) => q.eq("category", args.category!));
    } else if (args.status !== undefined) {
      itemsQuery = ctx.db.query("inventoryItems").withIndex("by_status", (q) => q.eq("status", args.status!));
    } else if (args.storageType !== undefined) {
      itemsQuery = ctx.db.query("inventoryItems").withIndex("by_storageType", (q) => q.eq("storageType", args.storageType!));
    } else {
      itemsQuery = ctx.db.query("inventoryItems").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    let items = await itemsQuery.collect();

    if (args.locationId !== undefined && args.category !== undefined) {
      items = items.filter((i) => i.category === args.category);
    }
    if (args.locationId !== undefined && args.status !== undefined) {
      items = items.filter((i) => i.status === args.status);
    }
    if (args.locationId !== undefined && args.storageType !== undefined) {
      items = items.filter((i) => i.storageType === args.storageType);
    }

    return items;
  },
});

export const listByLocation = query({
  args: {
    locationId: v.id("locations"),
    excludeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const items = await ctx.db
      .query("inventoryItems")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    if (args.excludeExpired) {
      return items.filter((i) => i.status !== "Expired" && i.status !== "WrittenOff");
    }
    return items;
  },
});

export const listExpiring = query({
  args: {
    daysUntilExpiry: v.number(),
    locationId: v.optional(v.id("locations")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const cutoff = Date.now() + args.daysUntilExpiry * 24 * 60 * 60 * 1000;

    let items;
    if (args.locationId !== undefined) {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId!))
        .collect();
    } else {
      items = await ctx.db
        .query("inventoryItems")
        .withIndex("by_expirationDate")
        .collect();
    }

    let filtered = items.filter(
      (i) =>
        i.expirationDate !== undefined &&
        i.expirationDate <= cutoff &&
        i.status !== "WrittenOff"
    );

    if (args.category !== undefined) {
      filtered = filtered.filter((i) => i.category === args.category);
    }

    filtered.sort((a, b) => (a.expirationDate ?? 0) - (b.expirationDate ?? 0));
    return filtered;
  },
});

export const getById = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return item;
  },
});

export const create = mutation({
  args: {
    locationId: v.id("locations"),
    donationBatchId: v.optional(v.id("donationBatches")),
    name: v.string(),
    category: v.union(v.literal("Produce"), v.literal("Dairy"), v.literal("Protein"), v.literal("Grains"), v.literal("Canned"), v.literal("Beverages"), v.literal("Snacks"), v.literal("PreparedMeals"), v.literal("HygieneNonFood"), v.literal("Baby"), v.literal("Other")),
    quantity: v.number(),
    unit: v.union(v.literal("Pounds"), v.literal("Ounces"), v.literal("Cans"), v.literal("Boxes"), v.literal("Bags"), v.literal("Cases"), v.literal("Gallons"), v.literal("Items"), v.literal("Pallets")),
    storageType: v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen")),
    expirationDate: v.optional(v.number()),
    lotNumber: v.optional(v.string()),
    barcode: v.optional(v.string()),
    minStockLevel: v.optional(v.number()),
    maxStockLevel: v.optional(v.number()),
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
    const itemId = await ctx.db.insert("inventoryItems", {
      organizationId: currentUser.organizationId,
      locationId: args.locationId,
      donationBatchId: args.donationBatchId,
      name: args.name,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      storageType: args.storageType,
      expirationDate: args.expirationDate,
      lotNumber: args.lotNumber,
      barcode: args.barcode,
      minStockLevel: args.minStockLevel,
      maxStockLevel: args.maxStockLevel,
      status: "InStock",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "inventoryItems",
      entityId: itemId,
      details: `Added ${args.quantity} ${args.unit} of ${args.name}`,
      locationId: args.locationId,
      createdAt: now,
    });

    return itemId;
  },
});

export const update = mutation({
  args: {
    id: v.id("inventoryItems"),
    name: v.optional(v.string()),
    category: v.optional(v.union(v.literal("Produce"), v.literal("Dairy"), v.literal("Protein"), v.literal("Grains"), v.literal("Canned"), v.literal("Beverages"), v.literal("Snacks"), v.literal("PreparedMeals"), v.literal("HygieneNonFood"), v.literal("Baby"), v.literal("Other"))),
    quantity: v.optional(v.number()),
    unit: v.optional(v.union(v.literal("Pounds"), v.literal("Ounces"), v.literal("Cans"), v.literal("Boxes"), v.literal("Bags"), v.literal("Cases"), v.literal("Gallons"), v.literal("Items"), v.literal("Pallets"))),
    storageType: v.optional(v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen"))),
    expirationDate: v.optional(v.number()),
    lotNumber: v.optional(v.string()),
    barcode: v.optional(v.string()),
    minStockLevel: v.optional(v.number()),
    maxStockLevel: v.optional(v.number()),
    status: v.optional(v.union(v.literal("InStock"), v.literal("Low"), v.literal("Critical"), v.literal("Expired"), v.literal("WrittenOff"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "Volunteer"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role !== "Admin") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    if (args.quantity !== undefined && args.quantity < 0) {
      throw new Error("INSUFFICIENT_INVENTORY: This operation would reduce inventory quantity below zero.");
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
      entityType: "inventoryItems",
      entityId: id,
      details: `Updated inventory item fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      locationId: existing.locationId,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const writeOff = mutation({
  args: {
    id: v.id("inventoryItems"),
    writeOffReason: v.union(v.literal("Expired"), v.literal("Damaged"), v.literal("Recalled"), v.literal("Other")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "WrittenOff",
      writeOffReason: args.writeOffReason,
      writeOffDate: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "WriteOff",
      entityType: "inventoryItems",
      entityId: args.id,
      details: `Written off ${existing.quantity} ${existing.unit} of ${existing.name}. Reason: ${args.writeOffReason}`,
      locationId: existing.locationId,
      createdAt: now,
    });

    return args.id;
  },
});

export const transfer = mutation({
  args: {
    id: v.id("inventoryItems"),
    destinationLocationId: v.id("locations"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (currentUser.role === "PantryManager") {
      assertLocationAccess(currentUser, existing.locationId);
    }

    const destLocation = await ctx.db.get(args.destinationLocationId);
    if (!destLocation || !destLocation.isActive) {
      throw new Error("INACTIVE_LOCATION: This location is currently inactive and cannot receive donations or host distributions.");
    }

    if (args.quantity > existing.quantity) {
      throw new Error("TRANSFER_INSUFFICIENT_QUANTITY: The source inventory item does not have enough quantity to complete this transfer.");
    }
    if (args.quantity <= 0) {
      throw new Error("INSUFFICIENT_INVENTORY: This operation would reduce inventory quantity below zero.");
    }

    const now = Date.now();
    const remainingQuantity = existing.quantity - args.quantity;

    await ctx.db.patch(args.id, {
      quantity: remainingQuantity,
      status: remainingQuantity === 0 ? "Critical" : existing.status,
      updatedAt: now,
    });

    const newItemId = await ctx.db.insert("inventoryItems", {
      organizationId: existing.organizationId,
      locationId: args.destinationLocationId,
      donationBatchId: existing.donationBatchId,
      name: existing.name,
      category: existing.category,
      quantity: args.quantity,
      unit: existing.unit,
      storageType: existing.storageType,
      expirationDate: existing.expirationDate,
      lotNumber: existing.lotNumber,
      barcode: existing.barcode,
      minStockLevel: existing.minStockLevel,
      maxStockLevel: existing.maxStockLevel,
      status: "InStock",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Transfer",
      entityType: "inventoryItems",
      entityId: args.id,
      details: `Transferred ${args.quantity} ${existing.unit} of ${existing.name} to new item ${newItemId}`,
      locationId: existing.locationId,
      createdAt: now,
    });

    return newItemId;
  },
});

export const updateExpiredItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const items = await ctx.db.query("inventoryItems").collect();

    for (const item of items) {
      if (!item.expirationDate) continue;
      if (item.status === "Expired" || item.status === "WrittenOff") continue;
      if (item.expirationDate <= now) {
        await ctx.db.patch(item._id, {
          status: "Expired",
          updatedAt: now,
        });
      }
    }
  },
});
