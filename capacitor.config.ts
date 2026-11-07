import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gmck.app",
  appName: "GMCK",
  webDir: "out",
  server: {
    // GMCK currently uses Next.js server rendering and Supabase SSR.
    // Keep the production web app hosted on Vercel until a native-compatible
    // local bundle/server architecture is implemented.
    url: "https://gmck.vercel.app",
    cleartext: false,
    allowNavigation: ["gmck.vercel.app"],
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#09090f",
    preferredContentMode: "mobile",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#09090f",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090f",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
