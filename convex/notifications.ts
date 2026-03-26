import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getCurrentUser, assertRole } from "./lib/auth";

export const listByUser = query({
  args: {
    isRead: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(args.limit ?? 50);

    if (args.isRead !== undefined) {
      return notifications.filter((n) => n.isRead === args.isRead);
    }
    return notifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .collect();

    return notifications.filter((n) => !n.isRead).length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("ENTITY_NOT_FOUND: The requested record was not found.");

    if (notification.userId !== currentUser._id) {
      throw new Error("UNAUTHORIZED_ROLE: You do not have permission to perform this action.");
    }

    await ctx.db.patch(args.id, { isRead: true });
    return args.id;
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", currentUser._id))
      .collect();

    const unreadNotifications = unread.filter((n) => !n.isRead);
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return unreadNotifications.length;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("LowStockAlert"), v.literal("ExpirationWarning"), v.literal("DistributionReminder"), v.literal("EligibilityRenewal"), v.literal("DonationReceived"), v.literal("NewClientRegistered"), v.literal("SystemAlert")),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("Info"), v.literal("Warning"), v.literal("Critical"))),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    assertRole(currentUser, ["Admin", "PantryManager"]);

    const now = Date.now();
    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      isRead: false,
      severity: args.severity,
      createdAt: now,
    });

    return notificationId;
  },
});

export const sendDistributionReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const tomorrow = now + oneDayMs;

    const distributions = await ctx.db
      .query("distributions")
      .withIndex("by_status", (q) => q.eq("status", "Scheduled"))
      .collect();

    const upcoming = distributions.filter(
      (d) => d.scheduledDate >= now && d.scheduledDate <= tomorrow
    );

    for (const dist of upcoming) {
      const allStaffIds = [dist.leadId, ...dist.assignedStaffIds];
      const uniqueStaffIds = [...new Set(allStaffIds.map(String))];

      for (const staffIdStr of uniqueStaffIds) {
        await ctx.db.insert("notifications", {
          userId: staffIdStr as any,
          type: "DistributionReminder",
          title: `Upcoming Distribution: ${dist.name}`,
          message: `Distribution "${dist.name}" is scheduled within the next 24 hours.`,
          link: `/distributions/${dist._id}`,
          isRead: false,
          severity: "Info",
          createdAt: now,
        });
      }
    }
  },
});
