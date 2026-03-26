"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

export function useAuthedQuery<F extends FunctionReference<"query">>(
  query: F,
  ...rest: FunctionArgs<F> extends Record<string, never>
    ? []
    : [args: FunctionArgs<F> | "skip"]
): FunctionReturnType<F> | undefined {
  const { isAuthenticated } = useConvexAuth();
  const args = rest[0] ?? ({} as any);
  return useQuery(query, isAuthenticated && args !== "skip" ? args : "skip") as any;
}
