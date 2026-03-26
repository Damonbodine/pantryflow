import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("Admin"), v.literal("PantryManager"), v.literal("VolunteerLead"), v.literal("Volunteer"), v.literal("ClientServices")),
    organizationId: v.id("organizations"),
    assignedLocationIds: v.optional(v.array(v.id("locations"))),
    bio: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_organizationId", ["organizationId"])
    .index("by_role", ["role"]),

  organizations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    phone: v.string(),
    email: v.string(),
    website: v.optional(v.string()),
    taxId: v.optional(v.string()),
    defaultVisitFrequencyDays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  locations: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(v.literal("Warehouse"), v.literal("Pantry"), v.literal("Mobile")),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    phone: v.optional(v.string()),
    operatingHours: v.string(),
    capacityPallets: v.optional(v.number()),
    hasDryStorage: v.boolean(),
    hasRefrigeration: v.boolean(),
    hasFreezer: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_type", ["type"])
    .index("by_isActive", ["isActive"]),

  clients: defineTable({
    organizationId: v.id("organizations"),
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
    eligibilityStatus: v.union(v.literal("Eligible"), v.literal("Pending"), v.literal("Expired"), v.literal("Ineligible")),
    eligibilityExpiresAt: v.optional(v.number()),
    visitFrequencyOverrideDays: v.optional(v.number()),
    lastVisitAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_eligibilityStatus", ["eligibilityStatus"])
    .index("by_lastName", ["lastName"]),

  donors: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    type: v.union(v.literal("GroceryStore"), v.literal("Restaurant"), v.literal("Farm"), v.literal("Individual"), v.literal("FoodBank"), v.literal("Corporation"), v.literal("FoodDrive"), v.literal("Government"), v.literal("Other")),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    preferredCategories: v.optional(v.array(v.string())),
    totalDonationsCount: v.number(),
    totalDonationsWeight: v.number(),
    lastDonationAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_type", ["type"])
    .index("by_isActive", ["isActive"]),

  donationBatches: defineTable({
    organizationId: v.id("organizations"),
    donorId: v.id("donors"),
    locationId: v.id("locations"),
    receivedById: v.id("users"),
    receivedAt: v.number(),
    totalWeightLbs: v.number(),
    itemCount: v.number(),
    condition: v.union(v.literal("Excellent"), v.literal("Good"), v.literal("Fair"), v.literal("NearExpiry")),
    storageAssignment: v.union(v.literal("Dry"), v.literal("Refrigerated"), v.literal("Frozen"), v.literal("Mixed")),
    temperatureVerified: v.boolean(),
    notes: v.optional(v.string()),
    receiptPhotoUrl: v.optional(v.string()),
    donorThankYouSent: v.boolean(),
    estimatedValue: v.optional(v.number()),
    status: v.union(v.literal("Received"), v.literal("Processing"), v.literal("Shelved"), v.literal("Rejected")),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_donorId", ["donorId"])
    .index("by_locationId", ["locationId"])
    .index("by_receivedById", ["receivedById"])
    .index("by_status", ["status"]),

  inventoryItems: defineTable({
    organizationId: v.id("organizations"),
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
    status: v.union(v.literal("InStock"), v.literal("Low"), v.literal("Critical"), v.literal("Expired"), v.literal("WrittenOff")),
    writeOffReason: v.optional(v.union(v.literal("Expired"), v.literal("Damaged"), v.literal("Recalled"), v.literal("Other"))),
    writeOffDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_locationId", ["locationId"])
    .index("by_donationBatchId", ["donationBatchId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_expirationDate", ["expirationDate"])
    .index("by_storageType", ["storageType"]),

  distributions: defineTable({
    organizationId: v.id("organizations"),
    locationId: v.id("locations"),
    name: v.string(),
    type: v.union(v.literal("WalkIn"), v.literal("DriveThrough"), v.literal("Delivery"), v.literal("PopUp")),
    scheduledDate: v.number(),
    endTime: v.optional(v.number()),
    status: v.union(v.literal("Scheduled"), v.literal("Active"), v.literal("Completed"), v.literal("Cancelled")),
    assignedStaffIds: v.array(v.id("users")),
    leadId: v.id("users"),
    estimatedClients: v.optional(v.number()),
    actualClients: v.optional(v.number()),
    totalWeightDistributed: v.optional(v.number()),
    totalItemsDistributed: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_locationId", ["locationId"])
    .index("by_leadId", ["leadId"])
    .index("by_status", ["status"])
    .index("by_scheduledDate", ["scheduledDate"]),

  distributionRecords: defineTable({
    distributionId: v.id("distributions"),
    clientId: v.id("clients"),
    checkedInById: v.id("users"),
    checkedInAt: v.number(),
    householdSizeAtVisit: v.number(),
    dietaryRestrictionsAtVisit: v.optional(v.array(v.string())),
    fulfilledById: v.optional(v.id("users")),
    fulfilledAt: v.optional(v.number()),
    status: v.union(v.literal("CheckedIn"), v.literal("InProgress"), v.literal("Fulfilled"), v.literal("NoShow")),
    totalWeightLbs: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_distributionId", ["distributionId"])
    .index("by_clientId", ["clientId"])
    .index("by_checkedInById", ["checkedInById"])
    .index("by_status", ["status"]),

  distributionLineItems: defineTable({
    distributionRecordId: v.id("distributionRecords"),
    inventoryItemId: v.id("inventoryItems"),
    itemName: v.string(),
    category: v.union(v.literal("Produce"), v.literal("Dairy"), v.literal("Protein"), v.literal("Grains"), v.literal("Canned"), v.literal("Beverages"), v.literal("Snacks"), v.literal("PreparedMeals"), v.literal("HygieneNonFood"), v.literal("Baby"), v.literal("Other")),
    quantity: v.number(),
    unit: v.union(v.literal("Pounds"), v.literal("Ounces"), v.literal("Cans"), v.literal("Boxes"), v.literal("Bags"), v.literal("Cases"), v.literal("Gallons"), v.literal("Items"), v.literal("Pallets")),
    weightLbs: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_distributionRecordId", ["distributionRecordId"])
    .index("by_inventoryItemId", ["inventoryItemId"]),

  inventoryAlerts: defineTable({
    organizationId: v.id("organizations"),
    locationId: v.id("locations"),
    inventoryItemId: v.id("inventoryItems"),
    type: v.union(v.literal("LowStock"), v.literal("CriticalStock"), v.literal("Expired"), v.literal("ExpiringIn3Days"), v.literal("ExpiringIn7Days"), v.literal("ExpiringIn14Days"), v.literal("Overstock")),
    severity: v.union(v.literal("Info"), v.literal("Warning"), v.literal("Critical")),
    title: v.string(),
    message: v.string(),
    isResolved: v.boolean(),
    resolvedById: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    acknowledgedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_locationId", ["locationId"])
    .index("by_inventoryItemId", ["inventoryItemId"])
    .index("by_type", ["type"])
    .index("by_isResolved", ["isResolved"])
    .index("by_severity", ["severity"]),

  foodCategories: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_slug", ["slug"])
    .index("by_isActive", ["isActive"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("LowStockAlert"), v.literal("ExpirationWarning"), v.literal("DistributionReminder"), v.literal("EligibilityRenewal"), v.literal("DonationReceived"), v.literal("NewClientRegistered"), v.literal("SystemAlert")),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
    severity: v.optional(v.union(v.literal("Info"), v.literal("Warning"), v.literal("Critical"))),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_isRead", ["isRead"])
    .index("by_type", ["type"]),

  auditLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    action: v.union(v.literal("Create"), v.literal("Update"), v.literal("Delete"), v.literal("StatusChange"), v.literal("WriteOff"), v.literal("Transfer"), v.literal("CheckIn"), v.literal("Distribute"), v.literal("Login")),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
    locationId: v.optional(v.id("locations")),
    ipAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_userId", ["userId"])
    .index("by_action", ["action"])
    .index("by_entityType", ["entityType"])
    .index("by_locationId", ["locationId"])
    .index("by_createdAt", ["createdAt"]),
});
