import type { Metadata } from "next";

import { SiteFooter } from "@/components/organisms/SiteFooter";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import "@/styles/globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "ท่วมไหม Thailand",
  description: "เช็กความเสี่ยงน้ำท่วมและสถานการณ์น้ำใกล้ตำแหน่งของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
