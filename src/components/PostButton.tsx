import sdk from "@farcaster/frame-sdk";
import { useSession } from "../providers/SessionProvider";
import { Button } from "./ui/button";
import { useWaitForNotifications } from "../hooks/use-wait-for-notifications";
import { useToast } from "../hooks/use-toast";
import Countdown, { zeroPad } from "react-countdown";
import Link from "next/link";

type PostButtonProps = {
  /** Location to redirect to after posting */
  redirect?: string;
};

export function PostButton({ redirect }: PostButtonProps) {
  const { context, user } = useSession();
  const { toast } = useToast();
  const { mutate: waitForNotifications } = useWaitForNotifications();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50">
      <div className="max-w-[400px] w-full">
        {!user?.notificationsEnabled ? (
          <Button
            size={"lg"}
            className="text-lg p-4 w-full"
            onClick={() => {
              sdk.actions.addFrame().then((result) => {
                if (result.added) {
                  waitForNotifications(void 0, {
                    onSuccess: () => {
                      toast({
                        title: "frame added",
                        description: "you can now post",
                      });
                    },
                    onError: () => {
                      toast({
                        title: "error",
                        description: "error adding frame",
                        variant: "destructive",
                      });
                    },
                  });
                }
              });
            }}
          >
            add frame to post
          </Button>
        ) : (
          user &&
          user.latestAlertExpiry && (
            <Link
              prefetch
              href={
                redirect
                  ? `/post?redirect=${encodeURIComponent(redirect)}`
                  : "/post"
              }
              className="w-full"
            >
              <Button
                size={"lg"}
                className="w-full"
                disabled={user.postsRemaining <= 0}
              >
                {user.postsRemaining <= 0 ? (
                  "already posted"
                ) : (
                  <>
                    post{" "}
                    {user.postsToday >= 1
                      ? `again (${user.postsRemaining})`
                      : user.latestAlertTime && (
                          <Countdown
                            date={new Date(user.latestAlertExpiry)}
                            renderer={({ minutes, seconds }) => {
                              const targetTime = new Date(
                                user.latestAlertExpiry!
                              ).getTime();
                              if (Date.now() > targetTime) {
                                return "late";
                              }
                              return `${zeroPad(minutes)}:${zeroPad(seconds)}`;
                            }}
                          ></Countdown>
                        )}
                  </>
                )}
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
