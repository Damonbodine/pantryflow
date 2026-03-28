import { action } from "./_generated/server";
import { v } from "convex/values";

const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const SYSTEM_PROMPTS: Record<string, string> = {
  donationNotes:
    "You are a food pantry volunteer logging a donation. Write a brief note about the donation including item condition, any sorting or storage needed, and a thank-you note for the donor record. Be practical and concise. Output only the note text.",
  distributionNotes:
    "You are a food pantry manager summarizing a distribution event. Include key metrics (clients served, approximate pounds distributed), any notable issues or successes, and suggestions for next time. Keep it factual and brief. Output only the summary text.",
  clientNotes:
    "You are a food pantry intake specialist documenting a client's needs. Note dietary restrictions, household composition, preferred items, frequency of visits, and any special circumstances. Be respectful and concise. Output only the notes text.",
};

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No text generated from OpenRouter");
  }

  return text as string;
}

export const generate = action({
  args: {
    fieldName: v.string(),
    context: v.any(),
  },
  handler: async (ctx, args) => {
    const systemPrompt = SYSTEM_PROMPTS[args.fieldName];
    if (!systemPrompt) {
      throw new Error(`Unknown field name: ${args.fieldName}`);
    }

    return await callOpenRouter(
      systemPrompt,
      `Here is the context for this entry:\n${JSON.stringify(args.context, null, 2)}`
    );
  },
});

export const categorizeDonation = action({
  args: {
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await callOpenRouter(
      `You are a food pantry inventory specialist. Given a donation description, analyze it and return a JSON object with these fields:
- category: one of "Produce", "Dairy", "Protein", "Grains", "Canned", "Beverages", "Snacks", "PreparedMeals", "HygieneNonFood", "Baby", "Other"
- subcategory: a more specific classification (e.g. "Fresh Vegetables", "Canned Soup", "Infant Formula")
- estimatedWeightLbs: estimated weight in pounds as a number
- storageType: one of "Dry", "Refrigerated", "Frozen"
- allergenFlags: array of allergen strings (e.g. ["Dairy", "Gluten", "Nuts", "Soy", "Eggs", "Shellfish"]) — empty array if none
- expirationUrgency: one of "Low" (shelf-stable, months away), "Medium" (weeks away), "High" (days away, perishable)

Return ONLY valid JSON, no markdown or explanation.`,
      `Donation description: ${args.description}`
    );

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { raw: result, parseError: true };
    }
  },
});

export const generateDistributionPlan = action({
  args: {
    distributionDate: v.string(),
    clientCount: v.number(),
    dietaryRestrictions: v.array(v.string()),
    inventory: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        quantity: v.number(),
        unit: v.string(),
        expirationDate: v.optional(v.number()),
        storageType: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inventorySummary = args.inventory.map((item) => ({
      ...item,
      daysUntilExpiry: item.expirationDate
        ? Math.round((item.expirationDate - now) / (1000 * 60 * 60 * 24))
        : null,
    }));

    const result = await callOpenRouter(
      `You are a food pantry distribution planner. Given the distribution details and current inventory, create an optimal distribution plan. Return a JSON object with:
- planSummary: brief 1-2 sentence overview
- itemsPerBag: array of objects with { name, category, quantity, unit, reason }
- priorityItems: array of objects with { name, reason } for items near expiration that should be distributed first
- dietaryNotes: string with notes on accommodating dietary restrictions
- estimatedBags: number of bags that can be assembled
- warnings: array of strings for any concerns (low stock, missing categories, etc.)

Return ONLY valid JSON, no markdown or explanation.`,
      `Distribution date: ${args.distributionDate}
Expected clients: ${args.clientCount}
Dietary restrictions to accommodate: ${args.dietaryRestrictions.join(", ") || "None specified"}

Current inventory:
${JSON.stringify(inventorySummary, null, 2)}`
    );

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { raw: result, parseError: true };
    }
  },
});

export const generateThankYou = action({
  args: {
    donorName: v.string(),
    donorType: v.string(),
    totalDonationsCount: v.number(),
    totalDonationsWeight: v.number(),
    recentDonations: v.array(
      v.object({
        receivedAt: v.number(),
        itemCount: v.number(),
        totalWeightLbs: v.number(),
        condition: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await callOpenRouter(
      `You are writing a heartfelt, personalized thank-you message on behalf of a food pantry to a donor. Mention specific items and quantities they donated. Include the real impact (e.g., "Your 200 lbs of donations will help feed approximately 50 families"). Be warm, sincere, and specific. Keep it to 3-4 paragraphs. Output only the thank-you message text.`,
      `Donor name: ${args.donorName}
Donor type: ${args.donorType}
Total lifetime donations: ${args.totalDonationsCount} donations, ${args.totalDonationsWeight.toLocaleString()} lbs total

Recent donations:
${args.recentDonations
  .map(
    (d) =>
      `- ${new Date(d.receivedAt).toLocaleDateString()}: ${d.itemCount} items, ${d.totalWeightLbs} lbs (${d.condition} condition)`
  )
  .join("\n")}`
    );
  },
});

export const generateInventoryInsight = action({
  args: {
    inventory: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        quantity: v.number(),
        unit: v.string(),
        status: v.string(),
        expirationDate: v.optional(v.number()),
        storageType: v.string(),
        minStockLevel: v.optional(v.number()),
        maxStockLevel: v.optional(v.number()),
      })
    ),
    stats: v.object({
      totalItems: v.number(),
      totalQuantity: v.number(),
      byCategory: v.any(),
      byStatus: v.any(),
      expiringIn7Days: v.number(),
      expired: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const result = await callOpenRouter(
      `You are a food pantry inventory analyst. Analyze the current inventory data and provide insights. Return a JSON object with:
- lowStockWarnings: array of { item, category, currentQuantity, recommendation }
- overstockAlerts: array of { item, category, currentQuantity, recommendation }
- expirationAlerts: array of { item, daysUntilExpiry, recommendation }
- seasonalPredictions: array of { prediction, reasoning }
- recommendedDonationItems: array of { item, category, reason }
- overallHealthScore: number 1-100 representing inventory health
- summary: 2-3 sentence overview of inventory state

Return ONLY valid JSON, no markdown or explanation.`,
      `Inventory summary:
Total items: ${args.stats.totalItems}
Total quantity: ${args.stats.totalQuantity}
Expiring in 7 days: ${args.stats.expiringIn7Days}
Already expired: ${args.stats.expired}
By category: ${JSON.stringify(args.stats.byCategory)}
By status: ${JSON.stringify(args.stats.byStatus)}

Detailed inventory:
${JSON.stringify(args.inventory.slice(0, 50), null, 2)}`
    );

    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return { raw: result, parseError: true };
    }
  },
});
