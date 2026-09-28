import type { Metadata } from "next";

import { CookieConsentCard } from "@/components/molecules/CookieConsentCard";
import { AppChrome } from "@/components/templates/AppChrome";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "เราช่วยกัน",
  description: "เช็กความเสี่ยงน้ำท่วมและสถานการณ์น้ำใกล้ตำแหน่งของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <AppChrome>{children}</AppChrome>
        <CookieConsentCard />
      </body>
    </html>
  );
}
