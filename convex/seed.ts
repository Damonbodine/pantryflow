import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // ── Clear all tables ──────────────────────────────────────────────
    const tables = [
      "auditLogs",
      "notifications",
      "inventoryAlerts",
      "distributionLineItems",
      "distributionRecords",
      "distributions",
      "inventoryItems",
      "donationBatches",
      "donors",
      "clients",
      "foodCategories",
      "users",
      "locations",
      "organizations"
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    const now = Date.now();
    const DAY = 86400000;

    // ── 1. Organization ───────────────────────────────────────────────
    const orgId = await ctx.db.insert("organizations", {
      name: "Austin Community Food Bank",
      description: "Serving the greater Austin, TX area with food assistance programs since 2005.",
      address: "8201 S Congress Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78745",
      phone: "(512) 555-0100",
      email: "info@austinfoodbank.org",
      website: "https://austinfoodbank.org",
      taxId: "74-2851963",
      defaultVisitFrequencyDays: 14,
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    });

    // ── 2. Locations ──────────────────────────────────────────────────
    const loc1 = await ctx.db.insert("locations", {
      organizationId: orgId,
      name: "Main Warehouse",
      type: "Warehouse",
      address: "8201 S Congress Ave",
      city: "Austin",
      state: "TX",
      zipCode: "78745",
      latitude: 30.2126,
      longitude: -97.7825,
      phone: "(512) 555-0101",
      operatingHours: "Mon-Fri 7AM-5PM, Sat 8AM-12PM",
      capacityPallets: 200,
      hasDryStorage: true,
      hasRefrigeration: true,
      hasFreezer: true,
      isActive: true,
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    });

    const loc2 = await ctx.db.insert("locations", {
      organizationId: orgId,
      name: "East Side Pantry",
      type: "Pantry",
      address: "2301 E 7th St",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      latitude: 30.261,
      longitude: -97.72,
      phone: "(512) 555-0102",
      operatingHours: "Tue-Thu 9AM-4PM, Sat 9AM-1PM",
      capacityPallets: 30,
      hasDryStorage: true,
      hasRefrigeration: true,
      hasFreezer: false,
      isActive: true,
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    });

    const loc3 = await ctx.db.insert("locations", {
      organizationId: orgId,
      name: "Mobile Unit Alpha",
      type: "Mobile",
      address: "Rundberg Ln Community Center",
      city: "Austin",
      state: "TX",
      zipCode: "78753",
      latitude: 30.357,
      longitude: -97.692,
      operatingHours: "Wed 10AM-2PM, Sat 9AM-12PM",
      hasDryStorage: true,
      hasRefrigeration: true,
      hasFreezer: false,
      isActive: true,
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    });

    // ── 3. Users ──────────────────────────────────────────────────────
    const user1 = await ctx.db.insert("users", {
      clerkId: "user_admin_001",
      name: "Maria Gonzalez",
      email: "maria@austinfoodbank.org",
      phone: "(512) 555-1001",
      role: "Admin",
      organizationId: orgId,
      isActive: true,
      lastLoginAt: now - DAY,
      createdAt: now - 60 * DAY,
      updatedAt: now - DAY,
    });

    const user2 = await ctx.db.insert("users", {
      clerkId: "user_manager_002",
      name: "James Chen",
      email: "james@austinfoodbank.org",
      phone: "(512) 555-1002",
      role: "PantryManager",
      organizationId: orgId,
      assignedLocationIds: [loc1, loc2],
      isActive: true,
      lastLoginAt: now - DAY,
      createdAt: now - 60 * DAY,
      updatedAt: now - DAY,
    });

    const user3 = await ctx.db.insert("users", {
      clerkId: "user_vlead_003",
      name: "Keisha Washington",
      email: "keisha@austinfoodbank.org",
      phone: "(512) 555-1003",
      role: "VolunteerLead",
      organizationId: orgId,
      assignedLocationIds: [loc2],
      isActive: true,
      lastLoginAt: now - DAY,
      createdAt: now - 60 * DAY,
      updatedAt: now - DAY,
    });

    const user4 = await ctx.db.insert("users", {
      clerkId: "user_vol_004",
      name: "David Park",
      email: "david@austinfoodbank.org",
      phone: "(512) 555-1004",
      role: "Volunteer",
      organizationId: orgId,
      assignedLocationIds: [loc2],
      bio: "Weekend volunteer since 2024. UT Austin student.",
      isActive: true,
      createdAt: now - 60 * DAY,
      updatedAt: now - 60 * DAY,
    });

    const user5 = await ctx.db.insert("users", {
      clerkId: "user_cs_005",
      name: "Sarah Martinez",
      email: "sarah@austinfoodbank.org",
      phone: "(512) 555-1005",
      role: "ClientServices",
      organizationId: orgId,
      assignedLocationIds: [loc2, loc3],
      isActive: true,
      lastLoginAt: now - DAY,
      createdAt: now - 60 * DAY,
      updatedAt: now - DAY,
    });

    // ── 4. Food Categories ────────────────────────────────────────────
    await ctx.db.insert("foodCategories", {
      organizationId: orgId,
      name: "Fresh Produce",
      slug: "produce",
      description: "Fruits, vegetables, and fresh herbs",
      icon: "Leaf",
      sortOrder: 1,
      isActive: true,
      createdAt: now - 60 * DAY,
    });
    await ctx.db.insert("foodCategories", {
      organizationId: orgId,
      name: "Dairy & Eggs",
      slug: "dairy",
      description: "Milk, cheese, yogurt, butter, and eggs",
      icon: "Milk",
      sortOrder: 2,
      isActive: true,
      createdAt: now - 60 * DAY,
    });
    await ctx.db.insert("foodCategories", {
      organizationId: orgId,
      name: "Protein",
      slug: "protein",
      description: "Meat, poultry, fish, tofu, and legumes",
      icon: "Drumstick",
      sortOrder: 3,
      isActive: true,
      createdAt: now - 60 * DAY,
    });
    await ctx.db.insert("foodCategories", {
      organizationId: orgId,
      name: "Grains & Pasta",
      slug: "grains",
      description: "Rice, bread, pasta, cereals, and flour",
      icon: "Wheat",
      sortOrder: 4,
      isActive: true,
      createdAt: now - 60 * DAY,
    });
    await ctx.db.insert("foodCategories", {
      organizationId: orgId,
      name: "Canned & Shelf-Stable",
      slug: "canned",
      description: "Canned vegetables, soups, beans, and other shelf-stable items",
      icon: "Package",
      sortOrder: 5,
      isActive: true,
      createdAt: now - 60 * DAY,
    });

    // ── 5. Donors ─────────────────────────────────────────────────────
    const donor1 = await ctx.db.insert("donors", {
      organizationId: orgId,
      name: "H-E-B Grocery #421",
      type: "GroceryStore",
      contactName: "Lisa Tran",
      contactEmail: "ltran@heb.com",
      contactPhone: "(512) 555-3001",
      address: "6001 W William Cannon Dr",
      city: "Austin",
      state: "TX",
      zipCode: "78749",
      preferredCategories: ["Produce", "Dairy", "Protein", "Canned"],
      totalDonationsCount: 48,
      totalDonationsWeight: 12500,
      lastDonationAt: now - 2 * DAY,
      isActive: true,
      createdAt: now - 90 * DAY,
    });

    const donor2 = await ctx.db.insert("donors", {
      organizationId: orgId,
      name: "Boggy Creek Farm",
      type: "Farm",
      contactName: "Larry Butler",
      contactEmail: "larry@boggycreekfarm.com",
      contactPhone: "(512) 555-3002",
      address: "3414 Lyons Rd",
      city: "Austin",
      state: "TX",
      zipCode: "78702",
      preferredCategories: ["Produce"],
      totalDonationsCount: 12,
      totalDonationsWeight: 2800,
      lastDonationAt: now - 4 * DAY,
      isActive: true,
      createdAt: now - 60 * DAY,
    });

    const donor3 = await ctx.db.insert("donors", {
      organizationId: orgId,
      name: "Robert Kim",
      type: "Individual",
      contactName: "Robert Kim",
      contactEmail: "rkim@gmail.com",
      contactPhone: "(512) 555-3003",
      address: "4500 Duval St",
      city: "Austin",
      state: "TX",
      zipCode: "78751",
      totalDonationsCount: 3,
      totalDonationsWeight: 150,
      lastDonationAt: now - 7 * DAY,
      isActive: true,
      createdAt: now - 30 * DAY,
    });

    // ── 6. Clients ────────────────────────────────────────────────────
    const client1 = await ctx.db.insert("clients", {
      organizationId: orgId,
      firstName: "Rosa",
      lastName: "Hernandez",
      phone: "(512) 555-2001",
      email: "rosa.h@email.com",
      address: "1450 E Riverside Dr Apt 204",
      city: "Austin",
      state: "TX",
      zipCode: "78741",
      householdSize: 5,
      householdMinors: 3,
      householdSeniors: 0,
      dietaryRestrictions: ["Gluten-Free"],
      preferredLanguage: "Spanish",
      annualIncomeBracket: "Under15k",
      eligibilityStatus: "Eligible",
      eligibilityExpiresAt: now + 90 * DAY,
      lastVisitAt: now - 3 * DAY,
      createdAt: now - 45 * DAY,
      updatedAt: now - 3 * DAY,
    });

    const client2 = await ctx.db.insert("clients", {
      organizationId: orgId,
      firstName: "Thanh",
      lastName: "Nguyen",
      phone: "(512) 555-2002",
      address: "3820 Manchaca Rd",
      city: "Austin",
      state: "TX",
      zipCode: "78704",
      householdSize: 3,
      householdMinors: 1,
      householdSeniors: 1,
      preferredLanguage: "Vietnamese",
      annualIncomeBracket: "15kTo25k",
      eligibilityStatus: "Eligible",
      eligibilityExpiresAt: now + 90 * DAY,
      lastVisitAt: now - 5 * DAY,
      createdAt: now - 45 * DAY,
      updatedAt: now - 5 * DAY,
    });

    const client3 = await ctx.db.insert("clients", {
      organizationId: orgId,
      firstName: "Marcus",
      lastName: "Johnson",
      phone: "(512) 555-2003",
      email: "marcus.j@email.com",
      address: "7700 Northcross Dr Apt 118",
      city: "Austin",
      state: "TX",
      zipCode: "78757",
      householdSize: 1,
      householdMinors: 0,
      householdSeniors: 0,
      dietaryRestrictions: ["Vegetarian", "Nut-Free"],
      preferredLanguage: "English",
      annualIncomeBracket: "25kTo35k",
      eligibilityStatus: "Eligible",
      eligibilityExpiresAt: now + 90 * DAY,
      createdAt: now - 30 * DAY,
      updatedAt: now - 30 * DAY,
    });

    const _client4 = await ctx.db.insert("clients", {
      organizationId: orgId,
      firstName: "Fatima",
      lastName: "Al-Rashidi",
      phone: "(512) 555-2004",
      address: "11400 Jollyville Rd",
      city: "Austin",
      state: "TX",
      zipCode: "78759",
      householdSize: 6,
      householdMinors: 4,
      householdSeniors: 0,
      dietaryRestrictions: ["Halal"],
      preferredLanguage: "Arabic",
      annualIncomeBracket: "Under15k",
      eligibilityStatus: "Pending",
      notes: "Recently arrived refugee family. Needs interpreter support.",
      createdAt: now - 3 * DAY,
      updatedAt: now - 3 * DAY,
    });

    const _client5 = await ctx.db.insert("clients", {
      organizationId: orgId,
      firstName: "Dorothy",
      lastName: "Williams",
      phone: "(512) 555-2005",
      address: "5600 Montopolis Dr",
      city: "Austin",
      state: "TX",
      zipCode: "78744",
      householdSize: 2,
      householdMinors: 0,
      householdSeniors: 2,
      dietaryRestrictions: ["Low-Sodium", "Diabetic-Friendly"],
      preferredLanguage: "English",
      annualIncomeBracket: "15kTo25k",
      eligibilityStatus: "Expired",
      eligibilityExpiresAt: now - 4 * DAY,
      lastVisitAt: now - 17 * DAY,
      notes: "Mobility issues, requests curbside pickup when available.",
      createdAt: now - 90 * DAY,
      updatedAt: now - 4 * DAY,
    });

    // ── 7. Donation Batches ───────────────────────────────────────────
    const batch1 = await ctx.db.insert("donationBatches", {
      organizationId: orgId,
      donorId: donor1,
      locationId: loc1,
      receivedById: user2,
      receivedAt: now - 2 * DAY,
      totalWeightLbs: 350,
      itemCount: 12,
      condition: "Good",
      storageAssignment: "Mixed",
      temperatureVerified: true,
      notes: "Weekly H-E-B pickup. Mix of produce, dairy, and canned goods.",
      donorThankYouSent: true,
      estimatedValue: 875.0,
      status: "Shelved",
      createdAt: now - 2 * DAY,
    });

    const batch2 = await ctx.db.insert("donationBatches", {
      organizationId: orgId,
      donorId: donor2,
      locationId: loc2,
      receivedById: user3,
      receivedAt: now - DAY,
      totalWeightLbs: 200,
      itemCount: 5,
      condition: "Excellent",
      storageAssignment: "Refrigerated",
      temperatureVerified: true,
      notes: "Fresh seasonal produce from Boggy Creek Farm.",
      donorThankYouSent: false,
      estimatedValue: 600.0,
      status: "Processing",
      createdAt: now - DAY,
    });

    const batch3 = await ctx.db.insert("donationBatches", {
      organizationId: orgId,
      donorId: donor3,
      locationId: loc2,
      receivedById: user3,
      receivedAt: now,
      totalWeightLbs: 50,
      itemCount: 8,
      condition: "Good",
      storageAssignment: "Dry",
      temperatureVerified: false,
      notes: "Individual drop-off. Mostly canned goods and pasta.",
      donorThankYouSent: true,
      estimatedValue: 120.0,
      status: "Received",
      createdAt: now,
    });

    // ── 8. Inventory Items ────────────────────────────────────────────
    const inv1 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      donationBatchId: batch1,
      name: "Fresh Tomatoes",
      category: "Produce",
      quantity: 80,
      unit: "Pounds",
      storageType: "Refrigerated",
      expirationDate: now + 7 * DAY,
      minStockLevel: 20,
      maxStockLevel: 200,
      status: "InStock",
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const _inv2 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      donationBatchId: batch1,
      name: "2% Milk (Gallon)",
      category: "Dairy",
      quantity: 24,
      unit: "Gallons",
      storageType: "Refrigerated",
      expirationDate: now + 5 * DAY,
      minStockLevel: 10,
      maxStockLevel: 50,
      status: "InStock",
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const inv3 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      donationBatchId: batch1,
      name: "Canned Black Beans",
      category: "Canned",
      quantity: 120,
      unit: "Cans",
      storageType: "Dry",
      expirationDate: now + 365 * DAY,
      minStockLevel: 50,
      maxStockLevel: 300,
      status: "InStock",
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const inv4 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc2,
      donationBatchId: batch2,
      name: "Organic Kale Bunches",
      category: "Produce",
      quantity: 30,
      unit: "Items",
      storageType: "Refrigerated",
      expirationDate: now + 3 * DAY,
      minStockLevel: 10,
      maxStockLevel: 60,
      status: "InStock",
      createdAt: now - DAY,
      updatedAt: now - DAY,
    });

    const inv5 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc2,
      name: "Frozen Chicken Breasts",
      category: "Protein",
      quantity: 5,
      unit: "Cases",
      storageType: "Frozen",
      expirationDate: now + 180 * DAY,
      minStockLevel: 10,
      maxStockLevel: 40,
      status: "Low",
      createdAt: now - 14 * DAY,
      updatedAt: now - DAY,
    });

    const inv6 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      name: "White Rice (5lb bags)",
      category: "Grains",
      quantity: 45,
      unit: "Bags",
      storageType: "Dry",
      expirationDate: now + 365 * DAY,
      minStockLevel: 20,
      maxStockLevel: 100,
      status: "InStock",
      createdAt: now - 60 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const inv7 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc2,
      donationBatchId: batch3,
      name: "Penne Pasta (1lb boxes)",
      category: "Grains",
      quantity: 36,
      unit: "Boxes",
      storageType: "Dry",
      expirationDate: now + 270 * DAY,
      minStockLevel: 15,
      maxStockLevel: 80,
      status: "InStock",
      createdAt: now,
      updatedAt: now,
    });

    const _inv8 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      name: "Apple Juice (64oz)",
      category: "Beverages",
      quantity: 18,
      unit: "Items",
      storageType: "Dry",
      expirationDate: now + 180 * DAY,
      minStockLevel: 10,
      maxStockLevel: 50,
      status: "InStock",
      createdAt: now - 14 * DAY,
      updatedAt: now - 2 * DAY,
    });

    const inv9 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc2,
      name: "Diapers Size 3 (Pack)",
      category: "Baby",
      quantity: 2,
      unit: "Cases",
      storageType: "Dry",
      minStockLevel: 5,
      maxStockLevel: 20,
      status: "Critical",
      createdAt: now - 60 * DAY,
      updatedAt: now - DAY,
    });

    const inv10 = await ctx.db.insert("inventoryItems", {
      organizationId: orgId,
      locationId: loc1,
      name: "Greek Yogurt Cups",
      category: "Dairy",
      quantity: 0,
      unit: "Items",
      storageType: "Refrigerated",
      expirationDate: now - DAY,
      status: "Expired",
      writeOffReason: "Expired",
      writeOffDate: now - DAY,
      createdAt: now - 21 * DAY,
      updatedAt: now - DAY,
    });

    // ── 9. Distributions ──────────────────────────────────────────────
    const dist1 = await ctx.db.insert("distributions", {
      organizationId: orgId,
      locationId: loc2,
      name: "East Side Saturday Distribution",
      type: "WalkIn",
      scheduledDate: now - 3 * DAY,
      endTime: now - 3 * DAY + 4 * 3600000,
      status: "Completed",
      assignedStaffIds: [user3, user4, user5],
      leadId: user3,
      estimatedClients: 40,
      actualClients: 37,
      totalWeightDistributed: 1850,
      totalItemsDistributed: 185,
      notes: "Smooth event. Ran out of dairy early.",
      createdAt: now - 6 * DAY,
      updatedAt: now - 3 * DAY,
    });

    const _dist2 = await ctx.db.insert("distributions", {
      organizationId: orgId,
      locationId: loc3,
      name: "Rundberg Mobile Pop-Up",
      type: "PopUp",
      scheduledDate: now + DAY,
      endTime: now + DAY + 4 * 3600000,
      status: "Scheduled",
      assignedStaffIds: [user2, user3, user4, user5],
      leadId: user2,
      estimatedClients: 60,
      createdAt: now - DAY,
      updatedAt: now - DAY,
    });

    // ── 10. Distribution Records ──────────────────────────────────────
    const drec1 = await ctx.db.insert("distributionRecords", {
      distributionId: dist1,
      clientId: client1,
      checkedInById: user5,
      checkedInAt: now - 3 * DAY + 600000,
      householdSizeAtVisit: 5,
      dietaryRestrictionsAtVisit: ["Gluten-Free"],
      fulfilledById: user4,
      fulfilledAt: now - 3 * DAY + 1800000,
      status: "Fulfilled",
      totalWeightLbs: 55,
      createdAt: now - 3 * DAY + 600000,
    });

    const drec2 = await ctx.db.insert("distributionRecords", {
      distributionId: dist1,
      clientId: client2,
      checkedInById: user5,
      checkedInAt: now - 3 * DAY + 1200000,
      householdSizeAtVisit: 3,
      fulfilledById: user4,
      fulfilledAt: now - 3 * DAY + 2400000,
      status: "Fulfilled",
      totalWeightLbs: 35,
      createdAt: now - 3 * DAY + 1200000,
    });

    const drec3 = await ctx.db.insert("distributionRecords", {
      distributionId: dist1,
      clientId: client3,
      checkedInById: user3,
      checkedInAt: now - 3 * DAY + 1800000,
      householdSizeAtVisit: 1,
      dietaryRestrictionsAtVisit: ["Vegetarian", "Nut-Free"],
      fulfilledById: user3,
      fulfilledAt: now - 3 * DAY + 3000000,
      status: "Fulfilled",
      totalWeightLbs: 20,
      createdAt: now - 3 * DAY + 1800000,
    });

    // ── 11. Distribution Line Items ───────────────────────────────────
    await ctx.db.insert("distributionLineItems", {
      distributionRecordId: drec1,
      inventoryItemId: inv3,
      itemName: "Canned Black Beans",
      category: "Canned",
      quantity: 6,
      unit: "Cans",
      weightLbs: 5.4,
      createdAt: now - 3 * DAY + 1800000,
    });

    await ctx.db.insert("distributionLineItems", {
      distributionRecordId: drec1,
      inventoryItemId: inv6,
      itemName: "White Rice (5lb bags)",
      category: "Grains",
      quantity: 2,
      unit: "Bags",
      weightLbs: 10,
      createdAt: now - 3 * DAY + 1800000,
    });

    await ctx.db.insert("distributionLineItems", {
      distributionRecordId: drec1,
      inventoryItemId: inv1,
      itemName: "Fresh Tomatoes",
      category: "Produce",
      quantity: 5,
      unit: "Pounds",
      weightLbs: 5,
      createdAt: now - 3 * DAY + 1800000,
    });

    await ctx.db.insert("distributionLineItems", {
      distributionRecordId: drec2,
      inventoryItemId: inv7,
      itemName: "Penne Pasta (1lb boxes)",
      category: "Grains",
      quantity: 3,
      unit: "Boxes",
      weightLbs: 3,
      createdAt: now - 3 * DAY + 2400000,
    });

    await ctx.db.insert("distributionLineItems", {
      distributionRecordId: drec3,
      inventoryItemId: inv4,
      itemName: "Organic Kale Bunches",
      category: "Produce",
      quantity: 2,
      unit: "Items",
      weightLbs: 1.5,
      createdAt: now - 3 * DAY + 3000000,
    });

    // ── 12. Inventory Alerts ──────────────────────────────────────────
    await ctx.db.insert("inventoryAlerts", {
      organizationId: orgId,
      locationId: loc2,
      inventoryItemId: inv5,
      type: "LowStock",
      severity: "Warning",
      title: "Low Stock: Frozen Chicken Breasts",
      message: "Only 5 cases remaining at East Side Pantry. Minimum stock level is 10 cases.",
      isResolved: false,
      createdAt: now - DAY,
    });

    await ctx.db.insert("inventoryAlerts", {
      organizationId: orgId,
      locationId: loc2,
      inventoryItemId: inv9,
      type: "CriticalStock",
      severity: "Critical",
      title: "Critical Stock: Diapers Size 3",
      message: "Only 2 cases remaining at East Side Pantry. Minimum stock level is 5 cases. High demand from families with infants.",
      isResolved: false,
      createdAt: now - DAY,
    });

    await ctx.db.insert("inventoryAlerts", {
      organizationId: orgId,
      locationId: loc2,
      inventoryItemId: inv4,
      type: "ExpiringIn3Days",
      severity: "Warning",
      title: "Expiring Soon: Organic Kale Bunches",
      message: "30 items of Organic Kale Bunches at East Side Pantry will expire in 3 days. Consider prioritizing for next distribution.",
      isResolved: false,
      createdAt: now - DAY,
    });

    // ── 13. Notifications ─────────────────────────────────────────────
    await ctx.db.insert("notifications", {
      userId: user2,
      type: "LowStockAlert",
      title: "Low Stock Alert: Frozen Chicken Breasts",
      message: "Frozen Chicken Breasts at East Side Pantry is below minimum stock level (5 of 10 cases).",
      link: "/inventory",
      isRead: false,
      severity: "Warning",
      createdAt: now - DAY,
    });

    await ctx.db.insert("notifications", {
      userId: user1,
      type: "DonationReceived",
      title: "New Donation Received",
      message: "Boggy Creek Farm donated 200 lbs of fresh produce to East Side Pantry.",
      link: "/donations",
      isRead: true,
      severity: "Info",
      createdAt: now - DAY,
    });

    await ctx.db.insert("notifications", {
      userId: user5,
      type: "EligibilityRenewal",
      title: "Client Eligibility Expired",
      message: "Dorothy Williams eligibility has expired. Please schedule a renewal assessment.",
      link: "/clients",
      isRead: false,
      severity: "Warning",
      createdAt: now - 4 * DAY,
    });

    // ── 14. Audit Logs ────────────────────────────────────────────────
    await ctx.db.insert("auditLogs", {
      organizationId: orgId,
      userId: user2,
      action: "Create",
      entityType: "donationBatches",
      entityId: batch2 as string,
      details: "Received donation batch from Boggy Creek Farm: 200 lbs, 5 items, condition Excellent.",
      locationId: loc2,
      createdAt: now - DAY,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: orgId,
      userId: user5,
      action: "CheckIn",
      entityType: "distributionRecords",
      entityId: drec1 as string,
      details: "Checked in Rosa Hernandez (household of 5) at East Side Saturday Distribution.",
      locationId: loc2,
      createdAt: now - 3 * DAY + 600000,
    });

    await ctx.db.insert("auditLogs", {
      organizationId: orgId,
      userId: user1,
      action: "StatusChange",
      entityType: "inventoryItems",
      entityId: inv10 as string,
      details: "Greek Yogurt Cups written off due to expiration. 48 items at Main Warehouse.",
      locationId: loc1,
      createdAt: now - DAY,
    });

    console.log("Seed complete: 1 org, 3 locations, 5 users, 5 food categories, 3 donors, 5 clients, 3 batches, 10 inventory items, 2 distributions, 3 distribution records, 5 line items, 3 alerts, 3 notifications, 3 audit logs.");
  },
});

