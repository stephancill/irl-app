import { useMutation } from "@tanstack/react-query";
import { fetchUser, useSession } from "../providers/SessionProvider";

export function useWaitForNotifications() {
  const { refetchUser, authFetch } = useSession();

  return useMutation({
    mutationFn: async () => {
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      while (attempts < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        const updatedUser = await fetchUser(authFetch);

        if (updatedUser?.notificationsEnabled) {
          refetchUser();
          return updatedUser;
        }
        attempts++;
      }
      throw new Error("Notifications not enabled after maximum attempts");
    },
  });
}
