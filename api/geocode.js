module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "GET 요청만 사용할 수 있습니다." });
  }

  const query = String(request.query?.q || "").trim();
  if (query.length < 2 || query.length > 160) {
    return response.status(400).json({ error: "장소명은 2자 이상 160자 이하로 입력해 주세요." });
  }

  const baseUrl = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ko");

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
        "User-Agent": process.env.NOMINATIM_USER_AGENT || "SaiDistanceApp/1.0 (OpenStreetMap distance demo)",
      },
    });

    if (!upstream.ok) {
      throw new Error(`Nominatim responded with ${upstream.status}`);
    }

    const places = await upstream.json();
    if (!Array.isArray(places) || places.length === 0) {
      return response.status(404).json({ error: `‘${query}’ 장소를 찾지 못했습니다. 더 구체적으로 입력해 주세요.` });
    }

    const place = places[0];
    response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    return response.status(200).json({
      displayName: place.display_name,
      lat: place.lat,
      lon: place.lon,
      type: place.type,
    });
  } catch (error) {
    console.error("Geocoding failed:", error.message);
    return response.status(502).json({ error: "장소 검색 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." });
  }
};
