import { fetchTmdWeatherWarningNews } from "@/server/external/tmd/client";
import { parseTmdWeatherWarnings } from "@/server/external/tmd/mapper";
import type { OfficialAlert } from "@/server/services/types";

export async function getOfficialAlerts(): Promise<{ alerts: OfficialAlert[]; sourceStatus: "live" | "fallback"; updatedAt: string }> {
  try {
    const xml = await fetchTmdWeatherWarningNews();
    const alerts = parseTmdWeatherWarnings(xml);

    return {
      alerts,
      sourceStatus: "live",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      sourceStatus: "fallback",
      updatedAt: new Date().toISOString(),
      alerts: [
        {
          id: "tmd-unavailable",
          agency: "TMD",
          title: "ไม่สามารถดึงประกาศจากกรมอุตุนิยมวิทยาได้ในขณะนี้",
          headline: "โปรดตรวจสอบประกาศโดยตรงจากกรมอุตุนิยมวิทยา",
          description: error instanceof Error ? error.message : "TMD source unavailable",
          severity: "info",
          url: "https://www.tmd.go.th/",
          publishedAt: new Date().toISOString(),
          source: "fallback",
        },
      ],
    };
  }
}
