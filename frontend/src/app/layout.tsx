import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { RegisterSW } from "@/components/RegisterSW";
import { CapacitorNative } from "@/components/CapacitorNative";
import { AuthProvider } from "@/context/AuthContext";

const outfit = Outfit({ 
  subsets: ["latin"], 
  variable: '--font-outfit' 
});

const fraunces = Fraunces({ 
  subsets: ["latin"], 
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Shopping Memo | Meal Planner",
  description: "Plan your meals and generate shopping lists",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shopping Memo",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased flex min-h-screen min-h-[100dvh]`}>
        <RegisterSW />
        <CapacitorNative />
        <AuthProvider>
          <Sidebar />
          <MobileBottomNav />
          <main className="flex-1 lg:ml-[260px] pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-6 px-3 sm:px-4 md:px-8 lg:px-12 pb-0 min-h-[100dvh] relative transition-all duration-300 w-full min-w-0">
            <div className="w-full max-w-[1400px] mx-auto min-w-0">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
