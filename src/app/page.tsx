import { LocationSearch } from "@/components/molecules/LocationSearch";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-9rem)]">
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center md:py-28">
        <p className="text-sm font-medium text-primary">ท่วมไหม Thailand</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">เช็กน้ำท่วมใกล้บ้านคุณ</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">ใส่สถานที่หรือใช้ตำแหน่งปัจจุบัน เพื่อดูระดับน้ำประมาณและสิ่งที่ควรทำ</p>
        <div className="mt-8 w-full">
          <LocationSearch />
        </div>
        <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">ข้อมูลนี้ใช้เพื่อเตรียมพร้อม โปรดติดตามประกาศจากหน่วยงานรัฐเสมอ</p>
      </section>
    </main>
  );
}
