"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoStep = {
  id: string;
  title: string;
  body: string;
  whyItMatters: string;
  routePrefix: string;
  target?: string;
  actionLabel?: string;
};

type DemoScenario = {
  id: string;
  title: string;
  estimatedMinutes: number;
  description: string;
  steps: DemoStep[];
};

const PANTRYFLOW_SCENARIO: DemoScenario = {
  id: "pantry-operations-review",
  title: "Pantry Operations Review",
  estimatedMinutes: 2,
  description:
    "Show how PantryFlow helps a nonprofit monitor inventory pressure, inspect stock, and execute a real distribution event.",
  steps: [
    {
      id: "dashboard-overview",
      title: "Start with the pantry operations dashboard",
      body:
        "The dashboard gives staff a quick read on total inventory, expiring items, active alerts, and quantity on hand.",
      whyItMatters:
        "A pantry team needs to trust the inventory picture before relying on the system for daily operations.",
      routePrefix: "/dashboard",
      target: "[data-demo='dashboard-overview']",
      actionLabel: "Open dashboard",
    },
    {
      id: "dashboard-stats",
      title: "Review the top-line stock metrics",
      body:
        "These cards surface the operational pressure points that matter most: volume, urgency, and current alert load.",
      whyItMatters:
        "This proves the app can help teams prioritize food movement, not just record donations after the fact.",
      routePrefix: "/dashboard",
      target: "[data-demo='dashboard-stats']",
    },
    {
      id: "inventory-insights",
      title: "Check for AI inventory guidance",
      body:
        "The inventory insights module summarizes stock risks and helps staff decide what needs movement or intervention next.",
      whyItMatters:
        "This is a strong credibility point for nonprofits dealing with spoilage, storage limits, and shifting demand.",
      routePrefix: "/dashboard",
      target: "[data-demo='inventory-insights']",
    },
    {
      id: "inventory-list",
      title: "Open the live inventory workspace",
      body:
        "The inventory page lets staff search active stock, review expiration timing, and move into item-level detail.",
      whyItMatters:
        "This is where teams move from monitoring to action on actual pantry stock.",
      routePrefix: "/inventory",
      target: "[data-demo='inventory-list']",
      actionLabel: "Open inventory",
    },
    {
      id: "inventory-detail",
      title: "Inspect one inventory item in context",
      body:
        "Each item record shows quantity, storage, status, expiration timing, and stock controls such as transfers or write-offs.",
      whyItMatters:
        "This demonstrates the system can support real warehouse decisions, not just category-level summaries.",
      routePrefix: "/inventory/",
      target: "[data-demo='inventory-detail']",
    },
    {
      id: "distribution-list",
      title: "Move into live distributions",
      body:
        "The distributions page helps the pantry team see scheduled and active events before opening one for check-in and fulfillment work.",
      whyItMatters:
        "A skeptical nonprofit wants to know the app covers the handoff from stocked food to actual client distribution.",
      routePrefix: "/distributions",
      target: "[data-demo='distribution-list']",
      actionLabel: "Open distributions",
    },
    {
      id: "distribution-detail",
      title: "Review a live distribution event",
      body:
        "The event record shows location, schedule, client check-ins, and current fulfillment progress within one screen.",
      whyItMatters:
        "This is the proof point that PantryFlow supports real service delivery, not just inventory intake.",
      routePrefix: "/distributions/",
      target: "[data-demo='distribution-detail']",
    },
  ],
};

function getScenarioById(id: string | null): DemoScenario | null {
  if (id === PANTRYFLOW_SCENARIO.id) return PANTRYFLOW_SCENARIO;
  return null;
}

function routeMatches(pathname: string, routePrefix: string) {
  if (routePrefix.endsWith("/")) {
    return pathname.startsWith(routePrefix);
  }
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export function DemoMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demo");
  const stepParam = searchParams.get("step");
  const scenario = useMemo(() => getScenarioById(demoId), [demoId]);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!scenario) {
      setStepIndex(0);
      return;
    }
    const parsedStep = Number(stepParam ?? "1");
    const nextStepIndex =
      Number.isFinite(parsedStep) && parsedStep > 0
        ? Math.min(parsedStep - 1, scenario.steps.length - 1)
        : 0;
    setStepIndex((prev) => (prev === nextStepIndex ? prev : nextStepIndex));
  }, [demoId, scenario, stepParam]);

  const currentStep = scenario?.steps[stepIndex];

  useEffect(() => {
    if (!scenario) return;
    const nextStepParam = String(stepIndex + 1);
    if (stepParam === nextStepParam) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("demo", scenario.id);
    params.set("step", nextStepParam);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, scenario, searchParams, stepIndex, stepParam]);

  useEffect(() => {
    if (!currentStep?.target) return;
    const element = document.querySelector(currentStep.target);
    if (!element) return;
    element.setAttribute("data-demo-active", "true");
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => {
      element.removeAttribute("data-demo-active");
    };
  }, [currentStep, pathname]);

  if (!scenario || !currentStep) return null;

  const activeScenario = scenario;
  const activeStep = currentStep;
  const onExpectedRoute = routeMatches(pathname, activeStep.routePrefix);
  const isLastStep = stepIndex === activeScenario.steps.length - 1;

  function updateSearch(nextDemo: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextDemo) {
      params.set("demo", nextDemo);
      params.set("step", String(stepIndex + 1));
    } else {
      params.delete("demo");
      params.delete("step");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function nextStep() {
    if (!onExpectedRoute) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("demo", activeScenario.id);
      params.set("step", String(stepIndex + 1));
      const route = activeStep.routePrefix.endsWith("/")
        ? activeStep.routePrefix.slice(0, -1)
        : activeStep.routePrefix;
      router.push(`${route}?${params.toString()}`);
      return;
    }
    if (!isLastStep) setStepIndex((prev) => prev + 1);
  }

  function previousStep() {
    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
  }

  function restartScenario() {
    setStepIndex(0);
    router.push("/dashboard?demo=pantry-operations-review&step=1");
  }

  function exitDemo() {
    updateSearch(null);
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-md">
      <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Guided Demo
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {activeScenario.steps.length}
              </span>
            </div>
            <h2 className="text-xl font-semibold">{activeScenario.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{activeScenario.description}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={exitDemo}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / activeScenario.steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          <div data-demo-panel-step={activeStep.id}>
            <h3 className="text-base font-semibold">{activeStep.title}</h3>
            <p className="mt-1 text-sm text-foreground/90">{activeStep.body}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Why this matters
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{activeStep.whyItMatters}</p>
          </div>
          {!onExpectedRoute && (
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary">
              Go to the next screen to continue this walkthrough.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousStep} disabled={stepIndex === 0}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={restartScenario}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Restart
            </Button>
          </div>
          <Button size="sm" onClick={nextStep}>
            {!onExpectedRoute ? (
              <>
                <Compass className="mr-1.5 h-4 w-4" />
                {activeStep.actionLabel ?? "Go there"}
              </>
            ) : isLastStep ? (
              "Finish"
            ) : (
              <>
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {isLastStep && onExpectedRoute && (
          <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            You&apos;ve completed the guided demo. Keep exploring, or restart the scenario any time.
          </div>
        )}
      </div>
    </div>
  );
}

export function DemoModeStartButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className={cn("gap-2", className)}
      onClick={() => router.push("/dashboard?demo=pantry-operations-review&step=1")}
    >
      <PlayCircle className="h-4 w-4" />
      Start guided demo
    </Button>
  );
}
