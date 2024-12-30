export async function GET() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  const config = {
    accountAssociation: accountAssociations[appUrl],
    frame: {
      version: "1",
      name: "dailysnap",
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/opengraph-image`,
      buttonTitle: "launch dailysnap",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhooks/farcaster`,
    },
  };

  return Response.json(config);
}

const accountAssociations = {
  "https://irl.steer.fun": {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiJpcmwuc3RlZXIuZnVuIn0",
    signature:
      "MHhmNzJkZTJiNjBlNDVkNTlmM2EzZDk1ZjQ4MjI5Yjg1MTdkZTFmNTk3OTkzMmVkMGJkOTU2YzAxZTIzYzkwZmEwNzJkY2E4MDk3NDhkYjM2NzRiNzhmMDk2MTAxMjkyZDBhYmE4ZDdjYTMzZTBmODQzZTljZDQyNWMwNTA1NjRiOTFj",
  },
  "https://8b38-102-135-241-214.ngrok-free.app": {
    header:
      "eyJmaWQiOjE2ODksInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgyNzM4QjIxY0I5NTIwMzM4RjlBMzc1YzNiOTcxQjE3NzhhZTEwMDRhIn0",
    payload: "eyJkb21haW4iOiI4YjM4LTEwMi0xMzUtMjQxLTIxNC5uZ3Jvay1mcmVlLmFwcCJ9",
    signature:
      "MHg3YmRjM2RjN2QwMDJkZjBiMmM3ZTc1YTQ5YTY5MjkzMGI0Y2U2M2ZhN2M0MWM1MTdmYzNmNzY5M2NjYmE4ZGQwMzMxNmZjYjI0Nzc5NzA4MzUxZjIzOGJmMmU3NWNiMjQzMmUwZDVjNmQxOWYwZGYzMWJmZjYwODQ2MjdhZjE2NjFi",
  },
};
