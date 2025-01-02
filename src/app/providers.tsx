"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "../providers/SessionProvider";
import { CSPostHogProvider } from "../providers/PosthogProvider";
import { Suspense } from "react";

const queryClient = new QueryClient();

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <CSPostHogProvider>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <SessionProvider>{children}</SessionProvider>
        </Suspense>
      </QueryClientProvider>
    </CSPostHogProvider>
  );
}
