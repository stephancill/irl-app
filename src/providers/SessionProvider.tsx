"use client";

import { User } from "@/types/user";
import sdk, { Context, FrameNotificationDetails } from "@farcaster/frame-sdk";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Session } from "lucia";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SessionContextType {
  user: User | null | undefined;
  session: Session | null | undefined;
  context: Context.FrameContext | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetchUser: () => void;
  logout: () => void;
  authFetch: typeof fetch;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  const {
    data: session,
    mutate: signInMutation,
    isPending: isSigningIn,
  } = useMutation({
    mutationFn: async () => {
      if (!context?.user?.fid) return;

      const challengeId = crypto.randomUUID();
      const challenge = await fetchChallenge(challengeId);

      const result = await sdk.actions.signIn({ nonce: challenge });

      return signIn({
        ...result,
        challengeId,
        referrerId:
          searchParams.get("ref") || searchParams.get("referrer") || undefined,
      });
    },
    onSuccess: () => {
      refetchUser();
    },
  });

  const authFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        headers: session?.id
          ? {
              Authorization: `Bearer ${session?.id}`,
            }
          : undefined,
      });
    },
    [session?.id]
  );

  const {
    data: user,
    isLoading,
    isError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () => fetchUser(authFetch),
    enabled: isSDKLoaded,
    refetchInterval: 1000 * 60,
  });

  const { mutate: setNotificationsMutation } = useMutation({
    mutationFn: setNotificationDetails,
    onSuccess: () => {
      refetchUser();
    },
  });

  useEffect(() => {
    if (isSDKLoaded && context?.user?.fid && isError) {
      signInMutation();
    }
  }, [isSDKLoaded, context?.user?.fid, signInMutation, isError]);

  const logout = () => {
    router.push("/logout");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const awaitedContext = await sdk.context;
        setContext(awaitedContext);
        sdk.actions.ready();
      } catch (error) {
        console.error("Error loading SDK:", error);
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        fid: user.fid,
      });
      Sentry.setUser({
        id: user.id,
        fid: user.fid,
      });
    }
  }, [user]);

  useEffect(() => {
    // Set notification details if somehow not set in db after webhook already called
    if (
      user &&
      !user?.notificationsEnabled &&
      context?.client.notificationDetails
    ) {
      setNotificationsMutation(context.client.notificationDetails);
    }
  }, [user, context, setNotificationsMutation]);

  useEffect(() => {
    if (isLoading || !isSDKLoaded) return;
    const currentPath = window.location.pathname;
    const searchParams = window.location.search;

    const redirectUrl = encodeURIComponent(`${currentPath}${searchParams}`);

    if (user && !user.timezone) {
      router.push(`/location?redirect=${redirectUrl}`);
    }
  }, [user, isLoading, isError, router, isSDKLoaded]);

  return (
    <SessionContext.Provider
      value={{
        user,
        session,
        context,
        isLoading: isLoading || !isSDKLoaded || isSigningIn,
        isError,
        refetchUser,
        logout,
        authFetch,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

async function fetchChallenge(challengeId: string): Promise<string> {
  const response = await fetch("/api/challenge", {
    method: "POST",
    body: JSON.stringify({ challengeId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch challenge");
  }

  const { challenge } = await response.json();

  return challenge;
}

async function signIn({
  message,
  signature,
  challengeId,
  referrerId,
}: {
  message: string;
  signature: string;
  challengeId: string;
  referrerId?: string;
}): Promise<Session> {
  const response = await fetch("/api/sign-in", {
    method: "POST",
    body: JSON.stringify({ message, signature, challengeId, referrerId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to sign in ${response.status}`);
  }

  const { session } = await response.json();

  if (!session) {
    throw new Error("Could not create session");
  }

  return session;
}

export async function fetchUser(fetchFn: typeof fetch = fetch): Promise<User> {
  const response = await fetchFn("/api/user");

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${response.status}`);
  }

  return response.json();
}

async function setNotificationDetails(
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  const response = await fetch("/api/user/notifications", {
    method: "PATCH",
    body: JSON.stringify(notificationDetails),
  });

  if (!response.ok) {
    throw new Error("Failed to set notification details");
  }
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
