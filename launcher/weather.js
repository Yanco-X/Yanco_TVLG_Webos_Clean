// Current weather above the date: a monochrome icon, temperature, feels-like temperature and
// relative humidity. Data from Open-Meteo
// (https://open-meteo.com, free, no API key). Refreshed every REFRESH_MINUTES; if the TV has no
// network the line stays hidden. CONFIG.weather = {lat, lon} picks the place (Barranquilla by
// default); CONFIG.weather = false turns it off.
(function () {
  "use strict";
  var REFRESH_MINUTES = 15;
  var place = (window.CONFIG && CONFIG.weather) || {};
  var box = document.getElementById("weather");
  var icon = document.getElementById("weatherIcon");
  var temp = document.getElementById("weatherTemp");
  if (!box || !icon || !temp || (window.CONFIG && CONFIG.weather === false)) return;
  var feels = document.createElement("span");
  var humidity = document.createElement("span");
  feels.id = "weatherFeels";
  humidity.id = "weatherHumidity";
  box.appendChild(feels);
  box.appendChild(humidity);

  var lat = typeof place.lat === "number" ? place.lat : 10.9685;
  var lon = typeof place.lon === "number" ? place.lon : -74.7813;
  var URL =
    "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day&timezone=auto";

  // Line icons on a 24x24 grid, drawn with the text colour (stroke="currentColor").
  var CLOUD = '<path d="M7 18.5h10a4 4 0 0 0 .4-7.98A5.5 5.5 0 0 0 6.9 11 3.75 3.75 0 0 0 7 18.5z"/>';
  var CLOUD_HIGH = '<path d="M7 15h10a3.6 3.6 0 0 0 .4-7.18A5 5 0 0 0 7.3 8.1 3.45 3.45 0 0 0 7 15z"/>';
  var ICONS = {
    sun:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z"/>',
    partlyDay:
      '<path d="M8 3v1.3M3.2 8H4.5M4.6 4.6l.9.9M11.4 4.6l-.9.9"/><path d="M5.6 10.4A3 3 0 0 1 10.6 7.4"/>' +
      '<path d="M9 20h8.5a3.5 3.5 0 0 0 .3-6.98A4.8 4.8 0 0 0 8.6 13.6 3.2 3.2 0 0 0 9 20z"/>',
    partlyNight:
      '<path d="M11.5 8.8A5 5 0 0 1 5.2 2.5 5 5 0 1 0 11.5 8.8z"/>' +
      '<path d="M9 20h8.5a3.5 3.5 0 0 0 .3-6.98A4.8 4.8 0 0 0 8.6 13.6 3.2 3.2 0 0 0 9 20z"/>',
    cloud: CLOUD,
    fog: '<path d="M4 9h16M6 13h12M4 17h16"/>',
    drizzle: CLOUD_HIGH + '<path d="M8 18.5v1M12 18.5v1M16 18.5v1"/>',
    rain: CLOUD_HIGH + '<path d="M8.5 17.5l-1.5 4M12.5 17.5l-1.5 4M16.5 17.5l-1.5 4"/>',
    storm: CLOUD_HIGH + '<path d="M12.5 15.5l-2.5 3.5h3.5l-2.5 3.5"/>',
    snow: CLOUD_HIGH + '<path d="M8 18.5v.01M12 20.5v.01M16 18.5v.01M10 22v.01M14 22v.01"/>',
  };
  var DROP =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c-3 4-6 7.2-6 10.5a6 6 0 0 0 12 0c0-3.3-3-6.5-6-10.5z"/></svg>';

  // WMO weather interpretation codes, as returned by Open-Meteo.
  function kind(code, day) {
    if (code === 0) return day ? "sun" : "moon";
    if (code === 1 || code === 2) return day ? "partlyDay" : "partlyNight";
    if (code === 3) return "cloud";
    if (code === 45 || code === 48) return "fog";
    if (code >= 51 && code <= 57) return "drizzle";
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95) return "storm";
    return "cloud";
  }

  function show(data) {
    var now = data && data.current;
    if (!now || typeof now.temperature_2m !== "number") return;
    icon.innerHTML = ICONS[kind(now.weather_code, now.is_day !== 0)];
    temp.textContent = Math.round(now.temperature_2m) + "°C";
    // Either extra reading may be missing; an empty span is hidden by CSS.
    feels.textContent =
      typeof now.apparent_temperature === "number"
        ? "Real " + Math.round(now.apparent_temperature) + "°C"
        : "";
    humidity.innerHTML =
      typeof now.relative_humidity_2m === "number"
        ? DROP + Math.round(now.relative_humidity_2m) + "%"
        : "";
    box.classList.add("shown");
  }

  function update() {
    var x = new XMLHttpRequest();
    x.open("GET", URL, true);
    x.timeout = 10000;
    x.onload = function () {
      if (x.status !== 200) return;
      try {
        show(JSON.parse(x.responseText));
      } catch (_) {}
    };
    x.send();
  }

  update();
  setInterval(update, REFRESH_MINUTES * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) update();
  });
})();
