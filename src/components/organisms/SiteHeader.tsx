import Link from "next/link";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/travel", label: "เดินทาง" },
  { href: "/map", label: "แผนที่" },
  { href: "/alerts", label: "ประกาศเตือน" },
  { href: "/prepare", label: "เตรียมตัว" },
  { href: "/data", label: "ข้อมูล" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          ท่วมไหม Thailand
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="เมนูหลัก">
          {navItems.map((item) => (
            <Button key={item.href} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
