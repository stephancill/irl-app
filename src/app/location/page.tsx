"use client";

import { useSession } from "../../providers/SessionProvider";

export default function Page() {
  const session = useSession();
  return (
    <div>
      <div>Update your location</div>
      <button>Update</button>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
