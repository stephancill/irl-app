declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WC_PROJECT_ID: string;
      DATABASE_URL: string;
      APP_URL: string;
    }
  }
}

export {};
