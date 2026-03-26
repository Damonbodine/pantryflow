import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs daily at 6 AM UTC. Scans all inventoryItems with an expirationDate and crea
crons.cron("checkExpirations", "0 6 * * *", internal.inventoryAlerts.checkExpirations);

// Runs every 6 hours (0:00, 6:00, 12:00, 18:00 UTC). Checks all inventoryItems whe
crons.cron("checkLowStock", "0 */6 * * *", internal.inventoryAlerts.checkLowStock);

// Runs daily at 8 AM CST (14:00 UTC). Queries distributions with status Scheduled 
crons.cron("sendDistributionReminders", "0 14 * * *", internal.notifications.sendDistributionReminders);

// Runs daily at 5 AM UTC (before checkExpirations). Queries all inventoryItems whe
crons.cron("updateExpiredItems", "0 5 * * *", internal.inventoryItems.updateExpiredItems);

export default crons;
