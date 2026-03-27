import { action } from "./_generated/server";
import { v } from "convex/values";

const SYSTEM_PROMPTS: Record<string, string> = {
  donationNotes:
    "You are a food pantry volunteer logging a donation. Write a brief note about the donation including item condition, any sorting or storage needed, and a thank-you note for the donor record. Be practical and concise. Output only the note text.",
  distributionNotes:
    "You are a food pantry manager summarizing a distribution event. Include key metrics (clients served, approximate pounds distributed), any notable issues or successes, and suggestions for next time. Keep it factual and brief. Output only the summary text.",
  clientNotes:
    "You are a food pantry intake specialist documenting a client's needs. Note dietary restrictions, household composition, preferred items, frequency of visits, and any special circumstances. Be respectful and concise. Output only the notes text.",
};

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
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Here is the context for this entry:\n${JSON.stringify(args.context, null, 2)}`,
            },
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
  },
});
