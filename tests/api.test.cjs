const test = require("node:test");
const assert = require("node:assert/strict");
const geocodeHandler = require("../api/geocode.js");
const routeHandler = require("../api/route.js");

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("geocode rejects a query that is too short", async () => {
  const response = createResponse();
  await geocodeHandler({ method: "GET", query: { q: "서" } }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /2자/);
});

test("geocode returns a normalized place", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => [{ display_name: "서울역, 서울특별시, 대한민국", lat: "37.5547", lon: "126.9706", type: "station" }],
  });

  try {
    const response = createResponse();
    await geocodeHandler({ method: "GET", query: { q: "서울역" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.displayName, "서울역, 서울특별시, 대한민국");
    assert.equal(response.body.lat, "37.5547");
    assert.match(response.headers["Cache-Control"], /s-maxage/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("route returns distance and duration from OSRM", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ routes: [{ distance: 401230, duration: 16800 }] }),
  });

  try {
    const response = createResponse();
    await routeHandler({
      method: "GET",
      query: { fromLat: "37.5547", fromLon: "126.9706", toLat: "35.1151", toLon: "129.0414" },
    }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.distanceKm, 401.23);
    assert.equal(response.body.durationMinutes, 280);
    assert.equal(response.body.routeType, "road");
  } finally {
    global.fetch = originalFetch;
  }
});
