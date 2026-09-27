import { IoBody } from "react-icons/io5";

type HumanFloodFigureProps = {
  depthCm: number;
  heightCm: number;
  bandLabel: string | null;
  belowBank?: boolean;
  groundLabel?: string;
  dryLabel?: string;
  label: string;
};

// Scene geometry, in percent of the container height:
// - ground occupies the bottom 22%, its top edge is the bank line;
// - the person is 70% tall with feet exactly on the bank line;
// - water rises from the bank line, never from the container bottom.
const GROUND_HEIGHT_PCT = 22;
const PERSON_HEIGHT_PCT = 70;
const MIN_WATER_PCT = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function HumanFloodFigure({
  depthCm,
  heightCm,
  bandLabel,
  belowBank = false,
  groundLabel = "ตลิ่ง",
  dryLabel = "ยังไม่ล้นตลิ่ง",
  label,
}: HumanFloodFigureProps) {
  const ratio = depthCm / Math.max(heightCm, 1);
  const waterHeightPct =
    depthCm <= 0 ? 0 : clamp(ratio * PERSON_HEIGHT_PCT, MIN_WATER_PCT, 100 - GROUND_HEIGHT_PCT);
  const overHead = ratio >= 1;

  return (
    <div className="relative h-full w-full overflow-hidden" role="img" aria-label={label}>
      {/* ground: the bank the person stands on */}
      <div className="absolute inset-x-0 bottom-0 bg-muted" style={{ height: `${GROUND_HEIGHT_PCT}%` }} aria-hidden="true" />
      {/* bank line */}
      <div
        className="absolute inset-x-0 border-t-2 border-dashed border-foreground/40"
        style={{ bottom: `${GROUND_HEIGHT_PCT}%` }}
        aria-hidden="true"
      />
      <span
        className="absolute left-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm"
        style={{ bottom: `calc(${GROUND_HEIGHT_PCT}% + 4px)` }}
        aria-hidden="true"
      >
        {groundLabel}
      </span>

      {/* person standing on the bank line */}
      <IoBody
        className="absolute left-1/2 w-auto -translate-x-1/2 text-foreground"
        style={{ bottom: `${GROUND_HEIGHT_PCT}%`, height: `${PERSON_HEIGHT_PCT}%` }}
        aria-hidden="true"
      />

      {/* water rising from the bank line */}
      <div
        className="absolute inset-x-0 rounded-t-[2rem] bg-primary/25"
        style={{ bottom: `${GROUND_HEIGHT_PCT}%`, height: `${waterHeightPct}%` }}
        aria-hidden="true"
      />

      {/* badges */}
      <span
        className="absolute bottom-2 left-2 rounded-full bg-background px-3 py-1 text-sm font-medium shadow-sm"
        aria-hidden="true"
      >
        น้ำ{bandLabel ?? ` ${depthCm} ซม.`}
      </span>
      {belowBank ? (
        <span
          className="absolute right-2 top-2 rounded-full bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm"
          aria-hidden="true"
        >
          {dryLabel}
        </span>
      ) : overHead ? (
        <span
          className="absolute right-2 top-2 rounded-full bg-background px-3 py-1 text-sm text-muted-foreground shadow-sm"
          aria-hidden="true"
        >
          สูงกว่าศีรษะ
        </span>
      ) : null}
    </div>
  );
}
