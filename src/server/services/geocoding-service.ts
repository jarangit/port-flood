import { isCoordinateInThailand } from "@/lib/validation";
import {
  reverseThailandPlace,
  searchThailandPlaces,
  searchThailandPostcode,
} from "@/server/external/nominatim/client";

const POSTCODE_PATTERN = /^\d{5}$/;
const NEARBY_CHOICE_RADIUS_KM = 12;
const MAX_NEARBY_CHOICES = 5;
const POI_CLASSES = new Set(["amenity", "shop", "tourism", "building", "office", "leisure"]);
const AREA_CLASSES = new Set(["boundary", "place"]);

type RawGeocodeResult = Awaited<ReturnType<typeof searchThailandPlaces>>[number];

const LOCAL_FALLBACK_PLACES: Array<RawGeocodeResult & { keywords: string[] }> = [
  {
    display_name: "ฟิวเจอร์พาร์ครังสิต, ตำบลประชาธิปัตย์, รังสิต, อำเภอธัญบุรี, จังหวัดปทุมธานี, ประเทศไทย",
    lat: "13.9890",
    lon: "100.6186",
    source: "local",
    name: "ฟิวเจอร์พาร์ครังสิต",
    class: "shop",
    type: "mall",
    address: {
      province: "จังหวัดปทุมธานี",
      city: "รังสิต",
      county: "อำเภอธัญบุรี",
      suburb: "ตำบลประชาธิปัตย์",
      postcode: "12130",
    },
    keywords: ["ฟิว", "ฟิวเจอร์", "ฟิวเต", "future", "future park", "รังสิต", "rangsit"],
  },
  {
    display_name: "กรุงเทพมหานคร, ประเทศไทย",
    lat: "13.7525",
    lon: "100.4935",
    source: "local",
    name: "กรุงเทพมหานคร",
    class: "place",
    type: "city",
    address: { province: "กรุงเทพมหานคร", city: "กรุงเทพมหานคร" },
    keywords: ["กรุงเทพ", "กรุงเทพมหานคร", "bangkok", "bkk"],
  },
  {
    display_name: "จังหวัดปทุมธานี, ประเทศไทย",
    lat: "14.0208",
    lon: "100.5250",
    source: "local",
    name: "จังหวัดปทุมธานี",
    class: "place",
    type: "province",
    address: { province: "จังหวัดปทุมธานี", city: "ปทุมธานี" },
    keywords: ["ปทุม", "ปทุมธานี", "pathum", "pathum thani"],
  },
  {
    display_name: "ดอนเมือง, กรุงเทพมหานคร, ประเทศไทย",
    lat: "13.9133",
    lon: "100.6042",
    source: "local",
    name: "ดอนเมือง",
    class: "place",
    type: "district",
    address: { province: "กรุงเทพมหานคร", city: "กรุงเทพมหานคร", district: "ดอนเมือง" },
    keywords: ["ดอนเมือง", "don mueang", "donmuang", "สนามบินดอนเมือง"],
  },
];

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function localFallbackPlaces(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return LOCAL_FALLBACK_PLACES.filter((place) =>
    place.keywords.some((keyword) => {
      const normalizedKeyword = normalizeSearchText(keyword);
      return normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized);
    }),
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function pickProvince(address?: Record<string, string | undefined>) {
  return address?.province ?? address?.state ?? "ไม่ทราบจังหวัด";
}

function pickDistrict(address?: Record<string, string | undefined>) {
  return address?.city ?? address?.town ?? address?.municipality ?? address?.county ?? address?.district ?? "ไม่ทราบอำเภอ/เขต";
}

function pickSubdistrict(address?: Record<string, string | undefined>) {
  return address?.suburb ?? address?.village ?? address?.hamlet ?? "ไม่ทราบตำบล/แขวง";
}

function pickPostcode(address?: Record<string, string | undefined>) {
  return address?.postcode ?? null;
}

function pickPlaceName(result: Awaited<ReturnType<typeof searchThailandPlaces>>[number]) {
  return (
    result.name ??
    result.address?.amenity ??
    result.address?.shop ??
    result.address?.tourism ??
    result.address?.building ??
    result.address?.office ??
    result.address?.leisure ??
    result.address?.road ??
    pickSubdistrict(result.address)
  );
}

function categoryLabel(result: Awaited<ReturnType<typeof searchThailandPlaces>>[number]) {
  if (result.class === "shop") return "ร้านค้า/ห้าง";
  if (result.class === "amenity") {
    if (result.type === "hospital" || result.type === "clinic") return "โรงพยาบาล/คลินิก";
    if (result.type === "school" || result.type === "university" || result.type === "college") return "สถานศึกษา";
    if (result.type === "fuel") return "ปั๊มน้ำมัน";
    return "สถานที่";
  }
  if (result.class === "tourism") return "สถานที่ท่องเที่ยว";
  if (result.class === "building") return "อาคาร/หมู่บ้าน";
  if (result.class === "office") return "สำนักงาน";
  if (result.class === "leisure") return "สถานที่พักผ่อน";
  if (result.class === "highway") return "ถนน";
  return AREA_CLASSES.has(result.class ?? "") ? "พื้นที่" : "สถานที่";
}

function rankSearchResult(query: string, result: Awaited<ReturnType<typeof searchThailandPlaces>>[number]) {
  const normalizedQuery = query.toLowerCase();
  const name = pickPlaceName(result).toLowerCase();
  let score = result.importance ? result.importance * 10 : 0;

  if (POI_CLASSES.has(result.class ?? "")) score += 30;
  if (AREA_CLASSES.has(result.class ?? "")) score -= 10;
  if (name && normalizedQuery.includes(name)) score += 12;
  if (name && name.includes(normalizedQuery)) score += 18;
  if (result.addresstype === "postcode") score -= 15;

  return score;
}

export async function geocodeThailand(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query, isPostcode: false, results: [] };
  }

  const isPostcode = POSTCODE_PATTERN.test(trimmed);
  let rawResults: RawGeocodeResult[] = [];

  try {
    rawResults = isPostcode ? await searchThailandPostcode(trimmed) : [];
  } catch {
    rawResults = [];
  }

  if (isPostcode && rawResults.length > 0) {
    // Nominatim resolves a postcode to a single centroid, so add named places
    // from the same district as sibling choices instead of auto-picking.
    const anchorLat = Number(rawResults[0].lat);
    const anchorLng = Number(rawResults[0].lon);
    const district = pickDistrict(rawResults[0].address);
    const province = pickProvince(rawResults[0].address);
    if (Number.isFinite(anchorLat) && Number.isFinite(anchorLng) && !district.startsWith("ไม่ทราบ")) {
      const areaQuery = province.startsWith("ไม่ทราบ") ? district : `${district} ${province}`;
      let siblings: RawGeocodeResult[] = [];
      try {
        siblings = await searchThailandPlaces(areaQuery);
      } catch {
        siblings = [];
      }
      const nearby = siblings
        .filter((candidate) => {
          const lat = Number(candidate.lat);
          const lng = Number(candidate.lon);
          // Skip coarse area centroids with no named sub-area and no postcode.
          const named =
            candidate.address?.suburb ??
            candidate.address?.village ??
            candidate.address?.hamlet ??
            candidate.address?.postcode;
          return (
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            named !== undefined &&
            haversineKm(anchorLat, anchorLng, lat, lng) <= NEARBY_CHOICE_RADIUS_KM
          );
        })
        .slice(0, MAX_NEARBY_CHOICES);
      rawResults = [...rawResults, ...nearby];
    }
  }
  // A postcode can cover several subdistricts, but if the structured lookup
  // finds nothing, fall back to a plain text search before giving up.
  if (rawResults.length === 0) {
    try {
      rawResults = await searchThailandPlaces(trimmed);
    } catch {
      rawResults = [];
    }
  }
  if (rawResults.length === 0) {
    rawResults = localFallbackPlaces(trimmed);
  }

  const seen = new Set<string>();
  const results = rawResults
    .sort((a, b) => rankSearchResult(trimmed, b) - rankSearchResult(trimmed, a))
    .map((result) => {
      const lat = Number(result.lat);
      const lng = Number(result.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isCoordinateInThailand(lat, lng)) {
        return null;
      }

      const dedupeKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      if (seen.has(dedupeKey)) {
        return null;
      }
      seen.add(dedupeKey);

      return {
        label: result.display_name,
        name: pickPlaceName(result),
        category: categoryLabel(result),
        lat,
        lng,
        province: pickProvince(result.address),
        district: pickDistrict(result.address),
        subdistrict: pickSubdistrict(result.address),
        postcode: pickPostcode(result.address),
        source:
          result.source === "photon"
            ? "Photon / OpenStreetMap"
            : result.source === "local"
              ? "ท่วมไทย fallback"
              : "OpenStreetMap Nominatim",
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  return { query, isPostcode, results };
}

export async function reverseGeocodeThailand(lat: number, lng: number, zoom = 14) {
  if (!isCoordinateInThailand(lat, lng)) {
    return {
      error: {
        code: "OUTSIDE_THAILAND",
        message: "พิกัดนี้อยู่นอกประเทศไทย",
      },
    } as const;
  }

  try {
    const result = await reverseThailandPlace(lat, lng, zoom);

    return {
      location: {
        lat,
        lng,
        province: pickProvince(result.address),
        district: pickDistrict(result.address),
        subdistrict: pickSubdistrict(result.address),
        basin: "ยังไม่มีข้อมูลลุ่มน้ำ",
      },
      label: result.display_name,
      sources: [{ name: "OpenStreetMap Nominatim", updatedAt: new Date().toISOString() }],
    } as const;
  } catch {
    return {
      location: {
        lat,
        lng,
        province: "ไม่ทราบจังหวัด",
        district: "ไม่ทราบอำเภอ/เขต",
        subdistrict: "ไม่ทราบตำบล/แขวง",
        basin: "ยังไม่มีข้อมูลลุ่มน้ำ",
      },
      label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      sources: [{ name: "OpenStreetMap Nominatim (fallback)", updatedAt: new Date().toISOString() }],
    } as const;
  }
}
