"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GeocodeResult = {
  label: string;
  name?: string;
  category?: string;
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  postcode?: string | null;
  source: string;
};

function primaryPlaceName(result: GeocodeResult) {
  if (result.name && !result.name.startsWith("ไม่ทราบ")) return result.name;
  if (result.subdistrict && result.subdistrict !== "ไม่ทราบตำบล/แขวง") return result.subdistrict;
  if (result.district && result.district !== "ไม่ทราบอำเภอ/เขต") return result.district;
  return result.label;
}

function secondaryPlaceLine(result: GeocodeResult) {
  return [result.category, result.subdistrict, result.district, result.province]
    .filter((part, index, array) => part && !part.startsWith("ไม่ทราบ") && array.indexOf(part) === index)
    .join(" · ");
}

export function LocationSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isPostcode, setIsPostcode] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isNavigating, startNavigate] = useTransition();
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const suggestBoxRef = useRef<HTMLDivElement>(null);
  const lastSelectedLabelRef = useRef<string | null>(null);
  const trimmedQuery = query.trim();
  const showSuggestBox =
    isSuggestOpen &&
    trimmedQuery.length >= 2 &&
    (isSuggesting || suggestions.length > 0 || suggestQuery === trimmedQuery);

  useEffect(() => {
    const trimmed = query.trim();
    if (lastSelectedLabelRef.current !== null) {
      if (trimmed === lastSelectedLabelRef.current) {
        return;
      }
      lastSelectedLabelRef.current = null;
    }
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      setSuggestQuery("");
      setSuggestError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSuggesting(true);
      setSuggestError(null);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: GeocodeResult[]; error?: { message?: string } };
        if (response.ok) {
          setSuggestions((data.results ?? []).slice(0, 5));
        } else {
          setSuggestions([]);
          setSuggestError(data.error?.message ?? "ค้นหาไม่สำเร็จ กรุณาลองอีกครั้ง");
        }
        setSuggestQuery(trimmed);
        setIsSuggestOpen(true);
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setSuggestions([]);
          setSuggestError("ค้นหาไม่สำเร็จ กรุณาลองอีกครั้ง");
          setSuggestQuery(trimmed);
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(event.target as Node)) {
        setIsSuggestOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSuggestOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelectSuggestion(suggestion: GeocodeResult) {
    const key = `${suggestion.lat}-${suggestion.lng}-${suggestion.label}`;
    lastSelectedLabelRef.current = suggestion.label;
    setQuery(suggestion.label);
    setSuggestions([]);
    setIsSuggestOpen(false);
    setPendingKey(key);
    startNavigate(() => {
      router.push(`/check?lat=${suggestion.lat}&lng=${suggestion.lng}`);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResults([]);
    setIsPostcode(false);
    setIsSuggestOpen(false);

    if (!query.trim()) {
      setError("กรุณากรอกชื่อจังหวัด อำเภอ ตำบล รหัสไปรษณีย์ หรือสถานที่");
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { results?: GeocodeResult[]; isPostcode?: boolean; error?: { message?: string } };

      if (!response.ok) {
        setError(data.error?.message ?? "ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง");
        return;
      }

      if (!data.results?.length) {
        setError(
          data.isPostcode
            ? "ไม่พบรหัสไปรษณีย์นี้ ลองตรวจเลขอีกครั้ง หรือค้นหาชื่อตำบลแทน"
            : "ไม่พบสถานที่นี้ ลองพิมพ์ชื่อจังหวัด อำเภอ หรือตำบลให้ชัดขึ้น",
        );
        return;
      }

      setIsPostcode(data.isPostcode ?? false);
      setResults(data.results);
    } catch {
      setError("ค้นหาสถานที่ไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseCurrentLocation() {
    setError(null);
    setResults([]);
    setIsPostcode(false);
    setSuggestions([]);
    setIsSuggestOpen(false);
    setSuggestQuery("");
    setSuggestError(null);

    if (!navigator.geolocation) {
      setError("เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่งปัจจุบัน");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setPendingKey("current-location");
        startNavigate(() => {
          router.push(`/check?lat=${position.coords.latitude}&lng=${position.coords.longitude}`);
        });
      },
      () => {
        setIsLocating(false);
        setError("ไม่สามารถเข้าถึงตำแหน่งได้ คุณยังค้นหาสถานที่เองได้");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <form className="rounded-2xl border bg-card p-3 shadow-sm" onSubmit={handleSubmit}>
      <Label htmlFor="location" className="sr-only">
        ค้นหาสถานที่
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1" ref={suggestBoxRef}>
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="location"
            name="q"
            className="pl-9 pr-9"
            placeholder="ค้นหาจังหวัด อำเภอ ตำบล รหัสไปรษณีย์ หรือสถานที่"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError(null);
              setResults([]);
              setIsPostcode(false);
              setPendingKey(null);
              setSuggestError(null);
              setIsSuggestOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0 || isSuggesting || (suggestQuery === trimmedQuery && trimmedQuery.length >= 2)) {
                setIsSuggestOpen(true);
              }
            }}
            inputMode="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestBox}
            aria-controls="homepage-location-suggestions"
            aria-autocomplete="list"
          />
          {isSuggesting ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : null}
          {showSuggestBox ? (
            <div
              id="homepage-location-suggestions"
              role="listbox"
              className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border bg-background p-2 text-left shadow-lg"
            >
              {suggestError ? (
                <p className="px-3 py-3 text-sm leading-6 text-destructive">{suggestError} หรือกดปุ่ม “เช็กพื้นที่”</p>
              ) : suggestions.length === 0 && !isSuggesting ? (
                <p className="px-3 py-3 text-sm leading-6 text-muted-foreground">
                  ไม่พบสถานที่สำหรับ “{trimmedQuery}” ลองพิมพ์เพิ่ม หรือกดปุ่ม “เช็กพื้นที่”
                </p>
              ) : null}
              {isSuggesting && suggestions.length === 0 ? (
                <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  กำลังค้นหา…
                </p>
              ) : null}
              {suggestions.map((suggestion) => {
                const key = `${suggestion.lat}-${suggestion.lng}-${suggestion.label}`;
                const isPending = pendingKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
                    disabled={pendingKey !== null}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <span className="block truncate text-sm font-medium text-foreground">
                      {isPending ? "กำลังโหลดข้อมูลน้ำท่วม…" : primaryPlaceName(suggestion)}
                    </span>
                    <span className="line-clamp-1 text-xs leading-5 text-muted-foreground">
                      {secondaryPlaceLine(suggestion) || suggestion.label}
                    </span>
                    <span className="line-clamp-1 text-xs leading-5 text-muted-foreground">{suggestion.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <Button type="submit" disabled={isSearching || isLocating || isNavigating}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          เช็กพื้นที่
        </Button>
        <Button type="button" variant="outline" disabled={isSearching || isLocating || isNavigating} onClick={handleUseCurrentLocation}>
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
          ใช้ตำแหน่งฉัน
        </Button>
      </div>
      {isNavigating ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          กำลังเปลี่ยนหน้า โหลดข้อมูลน้ำท่วม…
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {results.length ? (
        <div className="mt-4 rounded-xl border bg-background p-2 text-left">
          <p className="px-3 py-2 text-sm font-medium text-muted-foreground">
            {isPostcode && results.length > 1
              ? "รหัสไปรษณีย์นี้ครอบคลุมหลายพื้นที่ เลือกตำบล/แขวงที่ใกล้คุณที่สุดเพื่อประเมินให้แม่นขึ้น"
              : "เลือกสถานที่ที่ต้องการตรวจ"}
          </p>
          <div className="grid gap-1">
            {results.map((result) => {
              const key = `${result.lat}-${result.lng}-${result.label}`;
              const isPending = pendingKey === key;
              return (
                <button
                  key={key}
                  className="flex items-start gap-2 rounded-lg px-3 py-3 text-left text-sm leading-6 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
                  type="button"
                  disabled={pendingKey !== null}
                  onClick={() => {
                    setPendingKey(key);
                    startNavigate(() => {
                      router.push(`/check?lat=${result.lat}&lng=${result.lng}`);
                    });
                  }}
                >
                  {isPending ? <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">
                      {isPending ? "กำลังโหลดข้อมูลน้ำท่วม…" : primaryPlaceName(result)}
                      {result.postcode ? <span className="font-normal text-muted-foreground"> · {result.postcode}</span> : null}
                    </span>
                    <span className="block text-muted-foreground">{secondaryPlaceLine(result) || result.label}</span>
                    <span className="block truncate text-muted-foreground">{result.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {isPostcode ? (
            <p className="px-3 py-2 text-xs leading-5 text-muted-foreground">
              พิกัดจากรหัสไปรษณีย์เป็นค่าประมาณ ถ้าอยู่ในพื้นที่ตอนนี้ กด “ใช้ตำแหน่งฉัน” จะแม่นกว่า
            </p>
          ) : null}
          <p className="px-3 py-2 text-xs text-muted-foreground">ผลค้นหาจาก OpenStreetMap</p>
        </div>
      ) : null}
    </form>
  );
}
