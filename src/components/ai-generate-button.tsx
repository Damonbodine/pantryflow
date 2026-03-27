"use client";

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface AiGenerateButtonProps {
  fieldName: string;
  context: Record<string, unknown>;
  onGenerated: (text: string) => void;
  disabled?: boolean;
}

export function AiGenerateButton({
  fieldName,
  context,
  onGenerated,
  disabled,
}: AiGenerateButtonProps) {
  const generate = useAction(api.ai.generate);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleClick() {
    setIsGenerating(true);
    try {
      const text = await generate({ fieldName, context });
      onGenerated(text);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || isGenerating}
      onClick={handleClick}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </>
      )}
    </Button>
  );
}
