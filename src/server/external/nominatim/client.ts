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

type PhotonFeature = {
  properties?: {
    name?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
    street?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

const DEFAULT_NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_BASE_URL = (process.env.NOMINATIM_BASE_URL?.trim() || DEFAULT_NOMINATIM_BASE_URL).replace(
  /\/+$/,
  "",
);
const PHOTON_BASE_URL = (process.env.PHOTON_BASE_URL?.trim() || "https://photon.komoot.io").replace(/\/+$/, "");
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

function photonDisplayName(properties: NonNullable<PhotonFeature["properties"]>) {
  return [
    properties.name,
    properties.street,
    properties.locality,
    properties.district,
    properties.city,
    properties.county,
    properties.state,
    properties.country,
  ]
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(", ");
}

function mapPhotonFeature(feature: PhotonFeature): NominatimSearchResult | null {
  const properties = feature.properties;
  const coordinates = feature.geometry?.coordinates;
  if (!properties || !coordinates) return null;

  const [lon, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    display_name: photonDisplayName(properties) || `${lat}, ${lon}`,
    lat: String(lat),
    lon: String(lon),
    name: properties.name,
    type: properties.osm_value ?? properties.type,
    class: properties.osm_key,
    address: {
      road: properties.street,
      province: properties.state,
      state: properties.state,
      city: properties.city,
      municipality: properties.city,
      county: properties.county,
      district: properties.district,
      suburb: properties.locality,
      postcode: properties.postcode,
    },
  };
}

async function searchPhoton(query: string, limit = 10) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const response = await fetch(`${PHOTON_BASE_URL}/api/?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Photon request failed with ${response.status}`);
  }

  const data = (await response.json()) as PhotonResponse;
  return (data.features ?? [])
    .filter((feature) => feature.properties?.countrycode === "TH")
    .map(mapPhotonFeature)
    .filter((result): result is NominatimSearchResult => result !== null);
}

async function reversePhoton(lat: number, lng: number) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), limit: "1" });
  const response = await fetch(`${PHOTON_BASE_URL}/reverse?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Photon reverse request failed with ${response.status}`);
  }

  const data = (await response.json()) as PhotonResponse;
  const result = (data.features ?? [])
    .filter((feature) => feature.properties?.countrycode === "TH")
    .map(mapPhotonFeature)
    .find((item): item is NominatimSearchResult => item !== null);

  if (!result) {
    throw new Error("Photon reverse returned no Thailand result");
  }

  return {
    lat: result.lat,
    lon: result.lon,
    display_name: result.display_name,
    address: result.address,
  } satisfies NominatimReverseResult;
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

  try {
    return await fetchNominatim<NominatimSearchResult[]>("/search", params);
  } catch {
    return searchPhoton(query);
  }
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

  try {
    return await fetchNominatim<NominatimSearchResult[]>("/search", params);
  } catch {
    return searchPhoton(postcode);
  }
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

  try {
    return await fetchNominatim<NominatimReverseResult>("/reverse", params);
  } catch {
    return reversePhoton(lat, lng);
  }
}
