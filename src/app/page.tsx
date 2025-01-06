import { Metadata, ResolvingMetadata } from "next";
import { App } from "../components/App";
import { db } from "../lib/db";
import { getUserDatasCached } from "../lib/farcaster";
import { FRAME_METADATA } from "../lib/constants";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParent = await parent;
  const originalMetadata = {
    title: resolvedParent.title,
    description: resolvedParent.description,
    other: {
      ...resolvedParent.other,
    },
    openGraph: {
      ...resolvedParent.openGraph,
    },
  };

  const searchParams = await props.searchParams;
  const ref = searchParams["ref"];

  if (ref) {
    const user = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", ref)
      .executeTakeFirstOrThrow();

    const [farcasterUser] = await getUserDatasCached([user?.fid]);

    if (!farcasterUser) {
      throw new Error(`User ${user?.fid} not found (ref: ${ref})`);
    }

    const modifiedFrame = {
      ...FRAME_METADATA,
    };
    modifiedFrame.imageUrl = `${process.env.APP_URL}/images/ref?fid=${user.fid}`;
    modifiedFrame.button.action.url = `${process.env.APP_URL}?ref=${ref}`;

    return {
      title: `@${farcasterUser.username} on irl`,
      description: originalMetadata.description,
      other: {
        "fc:frame": JSON.stringify(modifiedFrame),
      },
    };
  }

  return originalMetadata;
}

export default function Page() {
  return <App />;
}
