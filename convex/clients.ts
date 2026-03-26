import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const list = query({
  args: {
    eligibilityStatus: v.optional(v.union(v.literal("Eligible"), v.literal("Pending"), v.literal("Expired"), v.literal("Ineligible"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "VolunteerLead", "ClientServices"]);

    let clientsQuery;
    if (args.eligibilityStatus !== undefined) {
      clientsQuery = ctx.db.query("clients").withIndex("by_eligibilityStatus", (q) => q.eq("eligibilityStatus", args.eligibilityStatus!));
    } else {
      clientsQuery = ctx.db.query("clients").withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId));
    }

    const limit = args.limit ?? 100;
    return await clientsQuery.order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const client = await ctx.db.get(args.id);
    if (!client) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");
    return client;
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const allClients = await ctx.db
      .query("clients")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", currentUser.organizationId))
      .collect();

    const searchTerm = args.query.toLowerCase();
    return allClients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchTerm) ||
        c.lastName.toLowerCase().includes(searchTerm) ||
        c.phone.includes(searchTerm)
    ).slice(0, 20);
  },
});

export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    householdSize: v.number(),
    householdMinors: v.optional(v.number()),
    householdSeniors: v.optional(v.number()),
    dietaryRestrictions: v.optional(v.array(v.string())),
    preferredLanguage: v.union(v.literal("English"), v.literal("Spanish"), v.literal("Mandarin"), v.literal("Vietnamese"), v.literal("Arabic"), v.literal("French"), v.literal("Other")),
    annualIncomeBracket: v.optional(v.union(v.literal("Under15k"), v.literal("15kTo25k"), v.literal("25kTo35k"), v.literal("35kTo50k"), v.literal("Over50k"), v.literal("PreferNotToSay"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "ClientServices"]);

    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      organizationId: currentUser.organizationId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      householdSize: args.householdSize,
      householdMinors: args.householdMinors,
      householdSeniors: args.householdSeniors,
      dietaryRestrictions: args.dietaryRestrictions,
      preferredLanguage: args.preferredLanguage,
      annualIncomeBracket: args.annualIncomeBracket,
      eligibilityStatus: "Pending",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: currentUser.organizationId,
      userId: currentUser._id,
      action: "Create",
      entityType: "clients",
      entityId: clientId,
      details: `Registered client ${args.firstName} ${args.lastName}`,
      createdAt: now,
    });

    return clientId;
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    householdSize: v.optional(v.number()),
    householdMinors: v.optional(v.number()),
    householdSeniors: v.optional(v.number()),
    dietaryRestrictions: v.optional(v.array(v.string())),
    preferredLanguage: v.optional(v.union(v.literal("English"), v.literal("Spanish"), v.literal("Mandarin"), v.literal("Vietnamese"), v.literal("Arabic"), v.literal("French"), v.literal("Other"))),
    annualIncomeBracket: v.optional(v.union(v.literal("Under15k"), v.literal("15kTo25k"), v.literal("25kTo35k"), v.literal("35kTo50k"), v.literal("Over50k"), v.literal("PreferNotToSay"))),
    eligibilityStatus: v.optional(v.union(v.literal("Eligible"), v.literal("Pending"), v.literal("Expired"), v.literal("Ineligible"))),
    eligibilityExpiresAt: v.optional(v.number()),
    visitFrequencyOverrideDays: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager", "ClientServices"]);

    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

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
      entityType: "clients",
      entityId: id,
      details: `Updated client fields: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`,
      createdAt: Date.now(),
    });

    return id;
  },
});
