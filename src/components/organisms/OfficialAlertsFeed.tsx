import { ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfficialAlert } from "@/server/services/types";

type OfficialAlertsFeedProps = {
  alerts: OfficialAlert[];
  sourceStatus: "live" | "fallback";
  updatedAt: string;
  compact?: boolean;
};

export function OfficialAlertsFeed({ alerts, sourceStatus, updatedAt, compact = false }: OfficialAlertsFeedProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>ประกาศทางการจากกรมอุตุนิยมวิทยา</CardTitle>
          <StatusBadge status={sourceStatus === "live" ? "watch" : "normal"} />
        </div>
        <CardDescription>
          {sourceStatus === "live"
            ? "ข้อมูลจริงจาก TMD อ่านรายละเอียดฉบับเต็มก่อนตัดสินใจ"
            : "ดึงประกาศล่าสุดไม่ได้ชั่วคราว กดลิงก์ไปอ่านประกาศโดยตรงที่เว็บไซต์ TMD"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold leading-7">{alert.title}</p>
              <StatusBadge status={alert.severity === "info" ? "normal" : alert.severity} />
            </div>
            {!compact && alert.headline ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{alert.headline}</p>
            ) : null}
            {!compact ? <p className="mt-2 text-sm leading-7 text-muted-foreground">{alert.description}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>ประกาศเมื่อ {new Date(alert.publishedAt).toLocaleString("th-TH")}</span>
              <a
                className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                href={alert.url}
                rel="noreferrer"
                target="_blank"
              >
                อ่านฉบับเต็ม
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
        <p className="text-xs leading-6 text-muted-foreground">
          แหล่งข้อมูล: Thai Meteorological Department | อัปเดตในระบบ {new Date(updatedAt).toLocaleString("th-TH")}
        </p>
      </CardContent>
    </Card>
  );
}
