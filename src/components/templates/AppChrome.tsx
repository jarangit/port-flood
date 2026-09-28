"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/organisms/SiteFooter";
import { SiteHeader } from "@/components/organisms/SiteHeader";

const FULLSCREEN_ROUTES = ["/travel"];

function isFullscreenRoute(pathname: string | null) {
  if (!pathname) return false;
  return FULLSCREEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = isFullscreenRoute(pathname);

  if (isFullscreen) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className="border-b border-primary/10 bg-primary/5 px-4 py-2 text-center text-xs leading-5 text-muted-foreground sm:text-sm">
        ข้อมูลอาจคลาดเคลื่อนหรือไม่ครบถ้วน ต้องขออภัยมา ณ ที่นี้
        โปรดใช้เป็นข้อมูลประกอบการตัดสินใจและติดตามประกาศจากหน่วยงานรัฐเสมอ
      </div>
      {children}
      <SiteFooter />
    </>
  );
}
