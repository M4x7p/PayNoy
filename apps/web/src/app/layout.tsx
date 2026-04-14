import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayNoy — รับเงินผ่าน Discord อัตโนมัติ ด้วย QR เดียว",
  description:
    "ระบบรับชำระเงินอัตโนมัติสำหรับ Discord Server ลูกค้าโอน → แจ้งเตือนทันที ไม่ต้องเช็คสลิปเองอีก เริ่มใช้ฟรี 7 วัน",
  keywords: [
    "Discord Payment",
    "QR Payment",
    "PromptPay",
    "รับเงินอัตโนมัติ",
    "Discord Bot",
    "ขายของใน Discord",
  ],
  openGraph: {
    title: "PayNoy — รับเงินผ่าน Discord อัตโนมัติ",
    description: "ลูกค้าโอน → แจ้งเตือนทันที ไม่ต้องเช็คสลิปเองอีก",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
