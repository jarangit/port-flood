import { Loader2 } from "lucide-react";

export default function CheckLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col items-center px-4 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">กำลังโหลดข้อมูลน้ำท่วม…</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        กำลังดึงข้อมูลความเสี่ยงน้ำท่วม สถานีใกล้เคียง และคำแนะนำ โปรดรอสักครู่
      </p>
      <div className="mt-8 grid w-full gap-3" aria-hidden="true">
        <div className="h-28 animate-pulse rounded-2xl border bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl border bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl border bg-muted" />
      </div>
    </main>
  );
}
