const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "GET 요청만 사용할 수 있습니다." });
  }

  const coordinates = {
    fromLat: Number(request.query?.fromLat),
    fromLon: Number(request.query?.fromLon),
    toLat: Number(request.query?.toLat),
    toLon: Number(request.query?.toLon),
  };

  if (!areValidCoordinates(coordinates)) {
    return response.status(400).json({ error: "올바른 좌표가 필요합니다." });
  }

  const path = `${coordinates.fromLon},${coordinates.fromLat};${coordinates.toLon},${coordinates.toLat}`;
  const url = `${OSRM_URL}/${path}?overview=false&steps=false&alternatives=false`;

  try {
    const upstream = await fetch(url, { headers: { Accept: "application/json" } });
    if (!upstream.ok) throw new Error(`OSRM responded with ${upstream.status}`);

    const data = await upstream.json();
    const route = data.routes?.[0];
    if (!route) throw new Error("No route was returned");

    response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return response.status(200).json({
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      routeType: "road",
    });
  } catch (error) {
    console.error("Routing failed, using straight-line distance:", error.message);
    return response.status(200).json({
      distanceKm: haversineDistance(coordinates),
      durationMinutes: null,
      routeType: "straight",
    });
  }
};

function areValidCoordinates({ fromLat, fromLon, toLat, toLon }) {
  return [fromLat, fromLon, toLat, toLon].every(Number.isFinite)
    && Math.abs(fromLat) <= 90
    && Math.abs(toLat) <= 90
    && Math.abs(fromLon) <= 180
    && Math.abs(toLon) <= 180;
}

function haversineDistance({ fromLat, fromLon, toLat, toLon }) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLon = toRadians(toLon - fromLon);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports.areValidCoordinates = areValidCoordinates;
module.exports.haversineDistance = haversineDistance;
