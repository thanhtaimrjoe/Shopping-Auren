import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  title: "Shopping-Auren",
  description: "Weekly meal planning and shopping checklist demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="vi" className={`${manrope.variable} ${lora.variable}`}><body>{children}</body></html>;
}
