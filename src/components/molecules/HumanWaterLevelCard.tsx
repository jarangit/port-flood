"use client";

import { useState } from "react";
import { HumanFloodFigure } from "@/components/illustrations/HumanFloodFigure";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HumanWaterLevelCardProps = {
  waterDepthCm: number | null;
  depthBandLabel?: string | null;
  driverName?: string | null;
  driverBankDiffM?: number | null;
  localSignalLabel?: string | null;
  displayDepthCm?: number | null;
  displayLabel?: string | null;
  displaySource?: "nearest_station_bank_diff" | "fallback_estimate" | "unknown";
  estimateBasis?: string[];
  defaultHeightCm?: number;
};

function getBodyReference(ratio: number) {
  if (ratio < 0.1) return "ประมาณข้อเท้า";
  if (ratio < 0.25) return "ประมาณหน้าแข้ง";
  if (ratio < 0.45) return "ประมาณเข่า";
  if (ratio < 0.65) return "ประมาณเอว";
  if (ratio < 0.85) return "ประมาณอก";
  if (ratio < 1) return "ประมาณคอ";
  return "สูงกว่าศีรษะ";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HumanWaterLevelCard({
  waterDepthCm,
  depthBandLabel = null,
  driverName = null,
  driverBankDiffM = null,
  localSignalLabel = null,
  displayDepthCm = null,
  displayLabel = null,
  displaySource = "fallback_estimate",
  estimateBasis = [],
  defaultHeightCm = 170,
}: HumanWaterLevelCardProps) {
  const [heightInput, setHeightInput] = useState(String(defaultHeightCm));

  if (waterDepthCm === null) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="space-y-3 p-4 sm:p-6">
          <div>
            <p className="text-[13px] font-medium text-primary sm:text-sm">ภาพจำลองวิธีอ่านระดับน้ำ</p>
            <CardTitle className="mt-1.5 text-2xl leading-snug tracking-tight sm:text-3xl md:text-4xl">
              ประเมินความลึกไม่ได้ตอนนี้
            </CardTitle>
            <CardDescription className="mt-2 text-base leading-7 text-foreground sm:text-lg">
              ไม่พบสถานีตรวจวัดในรัศมีใกล้พื้นที่นี้ จึงไม่มีตัวเลขมาประกอบภาพ
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <ul className="space-y-2 text-sm leading-7 text-muted-foreground sm:text-base">
            {estimateBasis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            โปรดติดตามประกาศจากหน่วยงานรัฐโดยตรง
          </p>
        </CardContent>
      </Card>
    );
  }

  const heightCm = clamp(Number(heightInput) || defaultHeightCm, 100, 230);
  const figureDepthCm = displayDepthCm ?? waterDepthCm;
  const waterRatio = figureDepthCm / heightCm;
  const bodyReference = getBodyReference(waterRatio);
  const belowBank = driverBankDiffM !== null && driverBankDiffM < 0;
  const figureLabel = displayLabel ?? depthBandLabel ?? `${figureDepthCm} เซนติเมตร`;
  const title =
    displaySource === "nearest_station_bank_diff" && displayLabel
      ? `${driverName ? `สถานี${driverName}: ` : ""}น้ำ${displayLabel}`
      : depthBandLabel
        ? `ถ้าน้ำสูง${depthBandLabel}${driverName ? ` จากสถานี${driverName}` : ""} จะประมาณไหน`
        : `ถ้าน้ำสูง ${figureDepthCm} ซม.${driverName ? ` จากสถานี${driverName}` : ""} จะประมาณไหน`;

  const guidance =
    figureDepthCm >= 100
      ? "ระดับนี้อันตรายมาก ควรหลีกเลี่ยงการเดินลุยน้ำและติดตามคำสั่งทางการ"
      : figureDepthCm >= 50
        ? "ระดับนี้เดินลำบากและอาจมีแรงน้ำ ควรเตรียมย้ายของขึ้นที่สูง"
        : figureDepthCm >= 15
          ? "รถเล็กอาจเริ่มเสี่ยงเมื่อเจอน้ำขัง ควรหลีกเลี่ยงเส้นทางน้ำท่วม"
          : "ระดับนี้ยังต่ำ แต่ควรติดตามสถานการณ์หากฝนยังตกต่อเนื่อง";

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div>
          <p className="text-[13px] font-medium text-primary sm:text-sm">ภาพจำลองวิธีอ่านระดับน้ำ</p>
          <CardTitle className="mt-1.5 break-words text-2xl leading-snug tracking-tight sm:text-3xl md:text-4xl">{title}</CardTitle>
          <CardDescription className="mt-2 text-base leading-7 text-foreground sm:text-lg">ประมาณ{bodyReference.replace("ประมาณ", "")}ของคนสูง {heightCm} ซม.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 pt-0 sm:gap-6 sm:p-6 sm:pt-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[380px] overflow-hidden rounded-2xl border bg-card p-3 sm:min-h-[480px] sm:p-4">
          <div className="relative mx-auto h-[340px] w-full max-w-[300px] sm:h-[440px] sm:max-w-[330px]">
            <HumanFloodFigure
              depthCm={figureDepthCm}
              heightCm={heightCm}
              bandLabel={figureLabel}
              belowBank={belowBank}
              groundLabel="ตลิ่ง"
              dryLabel="ยังไม่ล้นตลิ่ง"
              label={`ระดับน้ำที่สถานี ${figureLabel} ${bodyReference}`}
            />
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm">
            {bodyReference}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-2xl border bg-muted/40 p-4 sm:p-5">
            <Label htmlFor="heightCm" className="text-sm sm:text-base">
              ใส่ส่วนสูงของคุณ
            </Label>
            <div className="flex gap-2">
              <Input id="heightCm" className="mt-2 h-11 text-base sm:mt-3 sm:h-12 sm:text-lg" inputMode="numeric" min={100} max={230} value={heightInput} onChange={(event) => setHeightInput(event.target.value)} />
              <Button className="mt-2 h-11 sm:mt-3 sm:h-12" type="button" variant="outline" onClick={() => setHeightInput(String(defaultHeightCm))}>
                รีเซ็ต
              </Button>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-sm">ระบบจะปรับภาพเทียบกับส่วนสูงของคุณทันที</p>
          </div>

          <div className="rounded-2xl border bg-card p-4 sm:p-5">
            <p className="text-base font-semibold sm:text-lg">แปลว่าอะไร</p>
            <p className="mt-1.5 text-sm leading-7 text-muted-foreground sm:text-base">ระดับน้ำนี้คิดเป็นประมาณ {Math.round(clamp(waterRatio * 100, 0, 999))}% ของส่วนสูงที่ใส่ไว้</p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-7 sm:p-5 sm:text-base">
            <p className="text-base font-semibold text-foreground sm:text-lg">ควรรู้</p>
            <p className="mt-1.5 text-muted-foreground">{guidance}</p>
          </div>

          {localSignalLabel ? (
            <div className="rounded-2xl border bg-card p-4 sm:p-5">
              <p className="text-base font-semibold sm:text-lg">สำหรับพื้นที่ของคุณ</p>
              <p className="mt-1.5 text-sm leading-7 text-foreground sm:text-base">{localSignalLabel}</p>
              <p className="mt-2 text-[13px] leading-6 text-muted-foreground sm:text-sm">
                จากฝนและสถานีใกล้เคียง ภาพด้านบนคือระดับน้ำที่สถานี ไม่ใช่ความลึกบนถนนหรือในบ้านของคุณ
              </p>
            </div>
          ) : null}

          {estimateBasis.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 sm:p-5">
              <p className="text-base font-semibold sm:text-lg">ตัวเลขนี้มาจากไหน</p>
              <ul className="mt-1.5 space-y-1 text-sm leading-7 text-muted-foreground sm:text-base">
                {estimateBasis.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {belowBank ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  น้ำยังไม่ล้นตลิ่งที่สถานีนี้ ตัวเลขคือระยะห่างจากตลิ่ง ไม่ใช่น้ำท่วม
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {displaySource === "nearest_station_bank_diff"
                  ? "เป็นค่าตรวจวัดเทียบตลิ่งที่สถานีใกล้สุด ไม่ใช่ค่าตรวจวัดตรงจุดนี้"
                  : "เป็นการประมาณจากสถานีใกล้เคียง ไม่ใช่ค่าตรวจวัดตรงจุดนี้"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
