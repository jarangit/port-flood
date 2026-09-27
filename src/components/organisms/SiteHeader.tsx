"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "หน้าแรก" },
  { href: "/travel", label: "เดินทาง" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center"
          aria-label="ท่วมไทย หน้าแรก"
          onClick={() => setIsOpen(false)}
        >
          <span
            className="relative block h-10 w-28 overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-sm ring-1 ring-white/70 sm:h-11 sm:w-32"
            aria-hidden="true"
          >
            <img
              src="/images/toamThia.png"
              alt=""
              className="absolute left-1/2 top-1/2 h-[5.25rem] w-[10.5rem] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-24 sm:w-48"
            />
          </span>
          <span className="sr-only">ท่วมไทย</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="เมนูหลัก">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className="h-9 px-3"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={isOpen}
          aria-controls="mobile-site-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>
      {isOpen ? (
        <nav id="mobile-site-menu" className="border-t bg-background/95 px-3 py-3 shadow-[var(--shadow-soft)] md:hidden" aria-label="เมนูหลักบนมือถือ">
          <div className="mx-auto grid max-w-6xl gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted",
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
