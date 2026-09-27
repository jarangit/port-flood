import type { Metadata } from "next";

import { CookieConsentCard } from "@/components/molecules/CookieConsentCard";
import { SiteFooter } from "@/components/organisms/SiteFooter";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "ท่วมไทย",
  description: "เช็กความเสี่ยงน้ำท่วมและสถานการณ์น้ำใกล้ตำแหน่งของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <SiteHeader />
        <div className="border-b border-primary/10 bg-primary/5 px-4 py-2 text-center text-xs leading-5 text-muted-foreground sm:text-sm">
          ข้อมูลอาจคลาดเคลื่อนหรือไม่ครบถ้วน ต้องขออภัยมา ณ ที่นี้ โปรดใช้เป็นข้อมูลประกอบการตัดสินใจและติดตามประกาศจากหน่วยงานรัฐเสมอ
        </div>
        {children}
        <SiteFooter />
        <CookieConsentCard />
      </body>
    </html>
  );
}
