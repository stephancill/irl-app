declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WC_PROJECT_ID: string;
      DATABASE_URL: string;
      APP_URL: string;
      NEYNAR_API_KEY: string;
      DUNE_API_KEY: string;
      HUB_URL: string;
      NEXT_PUBLIC_POSTHOG_KEY: string | undefined;
      NEXT_PUBLIC_POSTHOG_HOST: string | undefined;
    }
  }
}

export {};
