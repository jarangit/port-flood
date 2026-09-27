"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const CONSENT_KEY = "tuamthai-cookie-consent";
const CONSENT_VERSION = "v1";

type ConsentChoice = "necessary" | "all";

function saveConsent(choice: ConsentChoice) {
  const value = `${CONSENT_VERSION}:${choice}`;
  window.localStorage.setItem(CONSENT_KEY, value);
  document.cookie = `${CONSENT_KEY}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

export function CookieConsentCard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(CONSENT_KEY)?.startsWith(`${CONSENT_VERSION}:`) !== true);
  }, []);

  function handleConsent(choice: ConsentChoice) {
    saveConsent(choice);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-5 sm:pb-5"
      aria-labelledby="cookie-consent-title"
      role="region"
    >
      <div className="mx-auto max-w-4xl rounded-3xl border border-primary/15 bg-card/95 p-4 shadow-[var(--shadow-float)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
              ขออนุญาตใช้คุกกี้
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              ท่วมไทยใช้คุกกี้ที่จำเป็นเพื่อจดจำการตั้งค่านี้และทำให้เว็บไซต์ใช้งานได้ตามปกติ หากคุณยอมรับทั้งหมด เราอาจใช้คุกกี้เพิ่มเติมเพื่อปรับปรุงบริการในอนาคต โดยไม่ขายข้อมูลส่วนบุคคลของคุณ
            </p>
            <Link href="/privacy" className="mt-2 inline-flex text-sm font-medium text-primary underline underline-offset-4">
              อ่านนโยบายความเป็นส่วนตัว
            </Link>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:items-center">
            <Button type="button" variant="outline" onClick={() => handleConsent("necessary")}>
              ใช้เฉพาะจำเป็น
            </Button>
            <Button type="button" onClick={() => handleConsent("all")}>
              ยอมรับทั้งหมด
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
