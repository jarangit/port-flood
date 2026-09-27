const TMD_BASE_URL = process.env.TMD_BASE_URL ?? "https://data.tmd.go.th/api";
const TMD_UID = process.env.TMD_UID ?? "demo";
const TMD_UKEY = process.env.TMD_UKEY ?? "demokey";

export async function fetchTmdWeatherWarningNews() {
  const params = new URLSearchParams({ uid: TMD_UID, ukey: TMD_UKEY });
  const response = await fetch(`${TMD_BASE_URL}/WeatherWarningNews/v2/?${params.toString()}`, {
    headers: {
      Accept: "application/xml,text/xml",
    },
    next: { revalidate: 15 * 60 },
  });

  if (!response.ok) {
    throw new Error(`TMD WeatherWarningNews failed with ${response.status}`);
  }

  return response.text();
}
