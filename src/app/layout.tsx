import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "./providers";
import { Toaster } from "../components/ui/toaster";

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

export async function generateMetadata(...args: any): Promise<Metadata> {
  return {
    title: "irl",
    description: "daily photos from the real world",
    other: {
      "fc:frame": JSON.stringify(frame),
    },
    openGraph: {
      images: [
        {
          url: `${appUrl}/og.png`,
        },
      ],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />

      <body>
        <Provider>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
