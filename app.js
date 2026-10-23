const form = document.querySelector("#distance-form");
const originInput = document.querySelector("#origin");
const destinationInput = document.querySelector("#destination");
const swapButton = document.querySelector("#swap-button");
const submitButton = document.querySelector("#calculate-button");
const buttonLabel = submitButton.querySelector(".button-label");
const message = document.querySelector("#form-message");
const result = document.querySelector("#result");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

swapButton.addEventListener("click", () => {
  const previousOrigin = originInput.value;
  originInput.value = destinationInput.value;
  destinationInput.value = previousOrigin;
  message.textContent = "";
  originInput.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const originQuery = originInput.value.trim();
  const destinationQuery = destinationInput.value.trim();

  result.hidden = true;
  message.textContent = "";

  if (!originQuery || !destinationQuery) {
    message.textContent = "출발지와 도착지를 모두 입력해 주세요.";
    (!originQuery ? originInput : destinationInput).focus();
    return;
  }

  if (originQuery === destinationQuery) {
    message.textContent = "서로 다른 두 장소를 입력해 주세요.";
    destinationInput.focus();
    return;
  }

  setLoading(true, "출발지를 찾는 중…");

  try {
    const origin = await geocode(originQuery);

    // The public Nominatim service asks clients to stay at or below one request per second.
    setLoading(true, "도착지를 찾는 중…");
    await wait(1100);
    const destination = await geocode(destinationQuery);

    setLoading(true, "경로를 계산하는 중…");
    const route = await getRoute(origin, destination);
    renderResult(origin, destination, route);
  } catch (error) {
    message.textContent = error.message || "잠시 후 다시 시도해 주세요.";
  } finally {
    setLoading(false);
  }
});

async function geocode(query) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `‘${query}’ 장소를 찾지 못했습니다.`);
  }

  return data;
}

async function getRoute(origin, destination) {
  const params = new URLSearchParams({
    fromLat: origin.lat,
    fromLon: origin.lon,
    toLat: destination.lat,
    toLon: destination.lon,
  });
  const response = await fetch(`/api/route?${params}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "두 장소 사이의 경로를 계산하지 못했습니다.");
  }

  return data;
}

function renderResult(origin, destination, route) {
  const distance = route.distanceKm;
  const decimals = distance >= 100 ? 0 : distance >= 10 ? 1 : 2;

  document.querySelector("#distance-value").textContent = distance.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  document.querySelector("#origin-name").textContent = compactPlaceName(origin.displayName);
  document.querySelector("#destination-name").textContent = compactPlaceName(destination.displayName);

  const summary = document.querySelector("#route-summary");
  if (route.routeType === "road") {
    summary.textContent = `자동차 경로 기준 · 예상 ${formatDuration(route.durationMinutes)}`;
  } else {
    summary.textContent = "직선거리 기준 · 도로 경로를 찾을 수 없어 직선거리로 표시했어요";
  }

  const mapUrl = new URL("https://www.openstreetmap.org/directions");
  mapUrl.searchParams.set("engine", "fossgis_osrm_car");
  mapUrl.searchParams.set("route", `${origin.lat},${origin.lon};${destination.lat},${destination.lon}`);
  document.querySelector("#map-link").href = mapUrl.toString();

  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function compactPlaceName(name) {
  const parts = name.split(",").map((part) => part.trim());
  return parts.slice(0, 3).join(", ");
}

function formatDuration(minutes) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}분`;
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`;
}

function setLoading(isLoading, label = "거리 계산하기") {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  buttonLabel.textContent = isLoading ? label : "거리 계산하기";
  form.setAttribute("aria-busy", String(isLoading));
}
