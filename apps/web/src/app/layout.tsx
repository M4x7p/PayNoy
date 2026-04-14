import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "เปย์หน่อย | ระบบรับเงิน QR อัตโนมัติ แจ้งเตือน Discord",
  description:
    "ระบบรับเงินผ่าน QR พร้อมแจ้งเตือน Discord อัตโนมัติ ไม่ต้องเช็คสลิปเอง ทดลองใช้ฟรี 7 วัน เหมาะสำหรับร้านค้าออนไลน์และสาย Discord",
  keywords: [
    "ระบบรับเงิน QR",
    "ตรวจสอบสลิป",
    "รับเงินอัตโนมัติ",
    "Discord payment",
    "QR payment ไทย",
    "ระบบแจ้งเตือนการโอนเงิน",
    "เปย์หน่อย",
    "PayNoi",
    "PromptPay",
    "ขายของใน Discord",
    "รับเงินผ่าน Discord",
    "ระบบตรวจสอบสลิปปลอม",
  ],
  openGraph: {
    title: "เปย์หน่อย | ระบบรับเงิน QR อัตโนมัติ แจ้งเตือน Discord",
    description:
      "ระบบรับเงินผ่าน QR พร้อมแจ้งเตือน Discord อัตโนมัติ ไม่ต้องเช็คสลิปเอง ทดลองใช้ฟรี 7 วัน",
    type: "website",
    locale: "th_TH",
    siteName: "เปย์หน่อย — PayNoi",
    images: [
      {
        url: "/dashboard-preview.png",
        width: 1200,
        height: 630,
        alt: "เปย์หน่อย Dashboard ระบบรับเงิน QR อัตโนมัติ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "เปย์หน่อย | ระบบรับเงิน QR อัตโนมัติ แจ้งเตือน Discord",
    description:
      "ระบบรับเงินผ่าน QR พร้อมแจ้งเตือน Discord อัตโนมัติ ไม่ต้องเช็คสลิปเอง",
    images: ["/dashboard-preview.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

/* FAQ Structured Data for Google Rich Results */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ระบบตรวจสอบสลิปของเปย์หน่อยคืออะไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ระบบตรวจสอบสลิปของเปย์หน่อยใช้ Omise Payment Gateway ที่ได้มาตรฐาน PCI-DSS ในการยืนยันการชำระเงินแบบ Real-time โดยไม่ต้องเช็คสลิปด้วยตนเอง ลดความเสี่ยงจากสลิปปลอมได้ 100%",
      },
    },
    {
      "@type": "Question",
      name: "ใช้เปย์หน่อยกับ Discord ได้ยังไง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เพียงเชิญบอทเปย์หน่อยเข้า Discord Server ของคุณ ใช้คำสั่ง /setup ตั้งค่าสินค้าและ QR Code จากนั้นลูกค้าจะกดปุ่มซื้อ สแกน QR ชำระเงิน และระบบจะแจ้งเตือน + มอบยศให้อัตโนมัติ ไม่ต้องเขียนโค้ด",
      },
    },
    {
      "@type": "Question",
      name: "เปย์หน่อยปลอดภัยไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ปลอดภัย 100% เราใช้ Omise ซึ่งเป็น Payment Gateway ที่ได้รับมาตรฐาน PCI-DSS ข้อมูลทุกจุดเข้ารหัส SSL/TLS และมีระบบป้องกันการทุจริตหลายชั้น",
      },
    },
    {
      "@type": "Question",
      name: "รองรับธนาคารอะไรบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เปย์หน่อยรองรับทุกธนาคารในประเทศไทยผ่านระบบ PromptPay ไม่ว่าจะเป็นกสิกรไทย กรุงเทพ ไทยพาณิชย์ กรุงศรี ทหารไทยธนชาต และอื่นๆ",
      },
    },
    {
      "@type": "Question",
      name: "มีค่าใช้จ่ายเท่าไหร่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "เปย์หน่อยมีแพ็กเกจฟรีให้เริ่มต้น แพ็กเกจ Pro เดือนละ 99 บาท และ Business เดือนละ 299 บาท ทดลองใช้ฟรี 7 วัน (ช่วงเปิดตัว 14 วัน) ไม่ต้องใส่บัตรเครดิต",
      },
    },
  ],
};

/* Organization Structured Data */
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "เปย์หน่อย — PayNoi",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "ระบบรับเงินผ่าน QR พร้อมแจ้งเตือน Discord อัตโนมัติ สำหรับร้านค้าออนไลน์",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable} ${prompt.className} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
