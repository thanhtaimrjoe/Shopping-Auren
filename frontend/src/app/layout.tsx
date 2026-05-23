import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased flex min-h-screen min-h-[100dvh]`}>
        <AuthProvider>
          <Sidebar />
          <MobileBottomNav />
          <main className="flex-1 lg:ml-[260px] pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-0 px-3 sm:px-4 md:px-8 lg:px-12 pb-0 min-h-[100dvh] relative transition-all duration-300 w-full min-w-0">
            <div className="w-full max-w-[1400px] mx-auto min-w-0">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
