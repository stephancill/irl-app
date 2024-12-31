"use client";

import { User } from "@/types/user";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Session } from "lucia";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

async function signIn({
  message,
  signature,
  challengeId,
}: {
  message: string;
  signature: string;
  challengeId: string;
}): Promise<Session> {
  const response = await fetch("/api/sign-in", {
    method: "POST",
    body: JSON.stringify({ message, signature, challengeId }),
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

export async function fetchUser(): Promise<User> {
  const response = await fetch("/api/user");

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${response.status}`);
  }

  return response.json();
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

interface SessionContextType {
  user: User | null | undefined;
  session: Session | null | undefined;
  context: FrameContext | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetchUser: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();

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
      });
    },
  });

  const {
    data: user,
    isLoading,
    isError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    enabled: isSDKLoaded && !!session,
    refetchInterval: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    if (isSDKLoaded && context?.user?.fid) {
      signInMutation();
    }
  }, [isSDKLoaded, context?.user?.fid, signInMutation]);

  const logout = () => {
    router.push("/logout");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const awaitedContext = await sdk.context;
        // awaitedContext.client.added = true;
        setContext(awaitedContext);
        sdk.actions.ready();
      } catch (error) {
        // console.error("Error loading SDK:", error);
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
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
