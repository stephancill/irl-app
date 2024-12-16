"use client";

import { useSession } from "../providers/SessionProvider";

export function App() {
  const session = useSession();

  return (
    <div>
      Hello {session.user?.fid} from {session.user?.locationLatitude}{" "}
      {session.user?.locationLongitude}
    </div>
  );
}
