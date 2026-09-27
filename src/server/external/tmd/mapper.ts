export type TmdWarning = {
  id: string;
  agency: "TMD";
  title: string;
  description: string;
  headline: string;
  severity: "info" | "watch" | "warning" | "critical";
  url: string;
  publishedAt: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  source: string;
};

function decodeXmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function getTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXmlEntities(match[1]) : "";
}

function inferSeverity(text: string): TmdWarning["severity"] {
  if (/หนักมาก|อันตราย|คลื่นสูงมาก|พายุ/i.test(text)) return "warning";
  if (/ฝนตกหนัก|คลื่นสูง|เฝ้าระวัง/i.test(text)) return "watch";
  return "info";
}

export function parseTmdWeatherWarnings(xml: string): TmdWarning[] {
  const warnings = xml.match(/<Warning>[\s\S]*?<\/Warning>/gi) ?? [];

  return warnings.map((warningXml, index) => {
    const issueNo = getTag(warningXml, "IssueNo") || String(index + 1);
    const title = getTag(warningXml, "TitleThai") || "ประกาศเตือนภัยสภาพอากาศ";
    const headline = getTag(warningXml, "HeadlineThai");
    const description = getTag(warningXml, "DescriptionThai") || headline || title;
    const url = getTag(warningXml, "WebUrlThai") || "https://www.tmd.go.th/";
    const publishedAt = getTag(warningXml, "AnnounceDate") || new Date().toISOString();
    const effectiveFrom = getTag(warningXml, "EffectStartDate") || undefined;
    const effectiveUntil = getTag(warningXml, "EffectEndDate") || undefined;

    return {
      id: `tmd-warning-${issueNo}-${publishedAt}`,
      agency: "TMD" as const,
      title,
      headline,
      description,
      severity: inferSeverity(`${title} ${headline} ${description}`),
      url,
      publishedAt,
      effectiveFrom,
      effectiveUntil,
      source: "Thai Meteorological Department WeatherWarningNews",
    };
  });
}
