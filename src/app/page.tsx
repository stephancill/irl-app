import { Metadata } from "next";
import { App } from "../components/App";

const appUrl = process.env.APP_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const metadata: Metadata = {
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function Page() {
  return <App />;
}
