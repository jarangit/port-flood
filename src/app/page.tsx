import Link from "next/link";
import { ArrowRight, Route, ShieldCheck } from "lucide-react";

import { LocationSearch } from "@/components/molecules/LocationSearch";
import { TravelRoutePlanner } from "@/components/organisms/TravelRoutePlanner";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-9rem)]">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center md:py-28">
        <p className="text-sm font-medium text-primary">เราช่วยกัน</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">เช็กน้ำท่วมใกล้บ้านคุณ</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">ใส่สถานที่หรือใช้ตำแหน่งปัจจุบัน เพื่อดูระดับน้ำประมาณและสิ่งที่ควรทำ</p>
        <div className="mt-8 w-full">
          <LocationSearch />
        </div>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">ข้อมูลนี้ใช้เพื่อเตรียมพร้อม โปรดติดตามประกาศจากหน่วยงานรัฐเสมอ</p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-20 md:pb-28" aria-label="ทดลองเช็กเส้นทาง">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Route className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">ฟีเจอร์แนะนำ · ลองเล่นได้เลย</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                เช็กเส้นทางก่อนออกเดินทาง
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                ใส่ต้นทางและปลายทาง เพื่อดูช่วงถนนที่ควรระวังน้ำท่วมตลอดเส้นทาง
              </p>
            </div>
          </div>
          <Button className="w-full shrink-0 sm:w-auto" asChild>
            <Link href="/travel">
              เปิดแผนที่เต็มจอ
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-5">
          <TravelRoutePlanner embedded />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-normal" aria-hidden="true" />
            เหมาะก่อนขับรถผ่านพื้นที่ฝนตกหนัก
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-normal" aria-hidden="true" />
            เห็นภาพรวมเป็น timeline อ่านง่ายบนมือถือ
          </p>
        </div>
      </section>
    </main>
  );
}
