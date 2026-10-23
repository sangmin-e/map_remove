const test = require("node:test");
const assert = require("node:assert/strict");
const { areValidCoordinates, haversineDistance } = require("../api/route.js");

test("validates geographic coordinates", () => {
  assert.equal(areValidCoordinates({ fromLat: 37.55, fromLon: 126.97, toLat: 35.11, toLon: 129.04 }), true);
  assert.equal(areValidCoordinates({ fromLat: 91, fromLon: 126.97, toLat: 35.11, toLon: 129.04 }), false);
  assert.equal(areValidCoordinates({ fromLat: 37.55, fromLon: Number.NaN, toLat: 35.11, toLon: 129.04 }), false);
});

test("calculates a plausible Seoul-to-Busan straight-line distance", () => {
  const distance = haversineDistance({ fromLat: 37.5547, fromLon: 126.9706, toLat: 35.1151, toLon: 129.0414 });
  assert.ok(distance > 320 && distance < 340, `unexpected distance: ${distance}`);
});
