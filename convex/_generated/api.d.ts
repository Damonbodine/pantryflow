/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auditLogs from "../auditLogs.js";
import type * as clients from "../clients.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as distributionLineItems from "../distributionLineItems.js";
import type * as distributionRecords from "../distributionRecords.js";
import type * as distributions from "../distributions.js";
import type * as donationBatches from "../donationBatches.js";
import type * as donors from "../donors.js";
import type * as foodCategories from "../foodCategories.js";
import type * as inventoryAlerts from "../inventoryAlerts.js";
import type * as inventoryItems from "../inventoryItems.js";
import type * as lib_auth from "../lib/auth.js";
import type * as locations from "../locations.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auditLogs: typeof auditLogs;
  clients: typeof clients;
  crons: typeof crons;
  dashboard: typeof dashboard;
  distributionLineItems: typeof distributionLineItems;
  distributionRecords: typeof distributionRecords;
  distributions: typeof distributions;
  donationBatches: typeof donationBatches;
  donors: typeof donors;
  foodCategories: typeof foodCategories;
  inventoryAlerts: typeof inventoryAlerts;
  inventoryItems: typeof inventoryItems;
  "lib/auth": typeof lib_auth;
  locations: typeof locations;
  notifications: typeof notifications;
  organizations: typeof organizations;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
