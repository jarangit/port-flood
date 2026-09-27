import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground md:grid-cols-2">
        <div className="space-y-2">
          <p>ข้อมูลนี้ใช้เพื่อการเตรียมพร้อม โปรดติดตามประกาศจากหน่วยงานรัฐเสมอ</p>
          <p>
            ค้นหาสถานที่โดยใช้ข้อมูลจาก{" "}
            <a className="underline underline-offset-4" href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
              OpenStreetMap
            </a>
            {" "}ผ่าน Nominatim
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 md:justify-end" aria-label="ลิงก์ท้ายเว็บ">
          <Link href="/faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </footer>
  );
}
