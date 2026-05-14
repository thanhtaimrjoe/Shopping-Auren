import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased flex min-h-screen`}>
        <Sidebar />
        <main className="flex-1 lg:ml-[260px] pt-16 lg:pt-0 p-4 md:p-8 lg:p-12 min-h-screen relative transition-all duration-300">
          <div className="w-full h-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
