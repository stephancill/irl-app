import { Metadata } from "next";
import { App } from "../components/App";

const appUrl = process.env.APP_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/og.png`,
  button: {
    title: "launch irl",
    action: {
      type: "launch_frame",
      name: "irl",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const metadata: Metadata = {
  title: "irl",
  description: "daily photos from the real world",
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function Page() {
  return <App />;
}
