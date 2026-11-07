import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  title: "SHOPPING AUREN",
  description: "Lên kế hoạch bữa ăn và danh sách mua sắm mỗi tuần.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="vi" className={`${manrope.variable} ${lora.variable}`}><body>{children}</body></html>;
}
