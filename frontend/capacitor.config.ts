import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shoppingmemo.app",
  appName: "Shopping Memo",
  webDir: "out",
  android: {
    allowMixedContent: true,
  },
  server: {
    // Use https scheme in WebView (recommended for Capacitor 6+)
    androidScheme: "https",
  },
};

export default config;
