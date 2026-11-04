// Wallpapers by time of day. Each band has its own photos in wallpapers/ (1920x1080, packaged so the
// TV can start without a network). Inside a band the photo changes every ROTATE_MINUTES; changes
// crossfade between two layers by opacity only, which the TV composites cheaply.
// CONFIG.wallpapers = false turns the feature off and leaves the plain black background.
(function () {
  "use strict";
  var BANDS = [
    // [name, first hour, number of photos]
    ["madrugada", 0, 4],
    ["manana", 5, 4],
    ["mediodia", 11, 4],
    ["tarde", 14, 4],
    ["noche", 18, 4],
  ];
  var ROTATE_MINUTES = 20;
  var layers = [document.getElementById("wallA"), document.getElementById("wallB")];
  var front = 0;
  var shown = null;
  var pending = null;

  if (!layers[0] || !layers[1] || (window.CONFIG && CONFIG.wallpapers === false)) return;

  function pick(now) {
    var hour = now.getHours();
    var band = BANDS[0];
    for (var i = 0; i < BANDS.length; i++) if (hour >= BANDS[i][1]) band = BANDS[i];
    var minutes = (hour - band[1]) * 60 + now.getMinutes();
    var index = Math.floor(minutes / ROTATE_MINUTES) % band[2];
    return { band: band[0], src: "wallpapers/" + band[0] + "-" + (index + 1) + ".jpg" };
  }

  function update() {
    var next = pick(new Date());
    if (next.src === shown || next.src === pending) return;
    pending = next.src;
    // Decode before showing, so the crossfade never reveals a half-loaded photo.
    var img = new Image();
    img.onload = function () {
      if (pending !== next.src) return;
      var back = layers[1 - front];
      back.style.backgroundImage = "url('" + next.src + "')";
      back.style.opacity = "1";
      layers[front].style.opacity = "0";
      front = 1 - front;
      shown = next.src;
      pending = null;
      document.body.setAttribute("data-band", next.band);
    };
    img.onerror = function () {
      if (pending === next.src) pending = null;
    };
    img.src = next.src;
  }

  update();
  setInterval(update, 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) update();
  });
})();
