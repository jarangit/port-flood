import { TravelRoutePlanner } from "@/components/organisms/TravelRoutePlanner";

export default function TravelPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-sky-100/80 via-[#f4f9ff] to-white text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/50 blur-[100px]" />
        <div className="absolute -right-20 top-52 h-80 w-80 rounded-full bg-cyan-200/40 blur-[110px]" />
      </div>
      <div className="relative mx-auto w-full max-w-5xl min-w-0 px-4 pb-16 pt-10 sm:px-5 md:pt-14">
        <div className="max-w-3xl min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-600">Travel Flood Check</p>
          <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            เช็กเส้นทางก่อนเดินทาง
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            เลือกต้นทางและปลายทาง ระบบจะทำ timeline เส้นตรงให้เห็นว่าช่วงไหนของเส้นทางควรระวังน้ำท่วม
          </p>
        </div>
        <div className="mt-8">
          <TravelRoutePlanner />
        </div>
      </div>
    </main>
  );
}
