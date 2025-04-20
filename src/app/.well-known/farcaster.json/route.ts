export async function GET() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  const config = {
    accountAssociation: accountAssociations[appUrl],
    frame: {
      version: "1",
      name: "irl",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "launch",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhooks/farcaster`,
    },
  };

  return Response.json(config);
}

/** Domain associations for different environments */
const accountAssociations = {
  "https://irl.steer.fun": {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiJpcmwuc3RlZXIuZnVuIn0",
    signature:
      "MHhmNzJkZTJiNjBlNDVkNTlmM2EzZDk1ZjQ4MjI5Yjg1MTdkZTFmNTk3OTkzMmVkMGJkOTU2YzAxZTIzYzkwZmEwNzJkY2E4MDk3NDhkYjM2NzRiNzhmMDk2MTAxMjkyZDBhYmE4ZDdjYTMzZTBmODQzZTljZDQyNWMwNTA1NjRiOTFj",
  },
  "https://caff-102-135-241-214.ngrok-free.app": {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiI3YWU2LTEwMi0xMzUtMjQxLTIxNC5uZ3Jvay1mcmVlLmFwcCJ9",
    signature:
      "MHg1MDUxNzRkYjBlZjNhY2UyY2QyYTRhZTRlMmQwZTJiZDgzNjQ3OGRhMjhlNzZmODM1MGQ5OGNlMWRjMjUwM2U4MzQxZDM2MjBkNDQ0MzhjMjcwMTk4Y2Y5ZWYzMmY4NDkzYTUzNzIxY2ZjYWU4MjhmZjhmZDY3ZDczN2E2Y2M0YTFj",
  },
  "http://localhost:3000": {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiJsb2NhbGhvc3QifQ",
    signature:
      "MHhmOWJkZGQ1MDA4Njc3NjZlYmI1ZmNjODk1NThjZWIxMTc5NjAwNjRlZmFkZWZjZmY4NGZhMzdiMjYxZjU1ZmYzMmZiMDg5NmY4NWU0MmM1YjM4MjQxN2NlMjFhOTBlYmM4YTIzOWFkNjE0YzA2ODM0ZDQ1ODk5NDI3YjE5ZjNkYTFi",
  },
};
