"use client";

import { User } from "@/types/user";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

async function fetchUser({
  message,
  signature,
  challengeId,
}: {
  message: string;
  signature: string;
  challengeId: string;
}): Promise<User> {
  const response = await fetch("/api/auth", {
    method: "POST",
    body: JSON.stringify({ message, signature, challengeId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  const { user } = await response.json();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
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
  context: FrameContext | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();

  const {
    data: user,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      if (!context?.user?.fid) return;

      const challengeId = crypto.randomUUID();
      const challenge = await fetchChallenge(challengeId);

      const result = await sdk.actions.signIn({ nonce: challenge });

      return fetchUser({
        ...result,
        challengeId,
      });
    },
    retry: false,
    enabled: !!context?.user?.fid,
    refetchInterval: 1000 * 60, // every minute
  });

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
        context,
        isLoading: isLoading || !isSDKLoaded,
        isError,
        refetch,
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
