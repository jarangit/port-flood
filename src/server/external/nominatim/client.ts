type NominatimSearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  class?: string;
  importance?: number;
  addresstype?: string;
  address?: {
    amenity?: string;
    shop?: string;
    tourism?: string;
    building?: string;
    office?: string;
    leisure?: string;
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    quarter?: string;
    province?: string;
    state?: string;
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    district?: string;
    suburb?: string;
    village?: string;
    hamlet?: string;
    postcode?: string;
  };
};

type NominatimReverseResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimSearchResult["address"];
};

const DEFAULT_NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_BASE_URL = (process.env.NOMINATIM_BASE_URL?.trim() || DEFAULT_NOMINATIM_BASE_URL).replace(
  /\/+$/,
  "",
);
const USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? "FloodCheckThailand/0.1 (public flood preparedness prototype; contact: admin@flood-check-thailand.local)";
const CONTACT_EMAIL = process.env.NOMINATIM_EMAIL;

async function fetchNominatim<T>(path: string, searchParams: URLSearchParams): Promise<T> {
  const url = `${NOMINATIM_BASE_URL}${path}?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "th,en;q=0.8",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function searchThailandPlaces(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "th",
    limit: "10",
  });

  if (CONTACT_EMAIL) {
    params.set("email", CONTACT_EMAIL);
  }

  return fetchNominatim<NominatimSearchResult[]>("/search", params);
}

export async function searchThailandPostcode(postcode: string) {
  const params = new URLSearchParams({
    postalcode: postcode,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "th",
    limit: "10",
  });

  if (CONTACT_EMAIL) {
    params.set("email", CONTACT_EMAIL);
  }

  return fetchNominatim<NominatimSearchResult[]>("/search", params);
}

export async function reverseThailandPlace(lat: number, lng: number, zoom = 14) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    zoom: String(zoom),
  });

  if (CONTACT_EMAIL) {
    params.set("email", CONTACT_EMAIL);
  }

  return fetchNominatim<NominatimReverseResult>("/reverse", params);
}
